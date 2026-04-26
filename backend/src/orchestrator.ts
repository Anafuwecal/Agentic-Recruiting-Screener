import { mailEmployer, mailCandidate } from './services/mailer';
import { auditLog } from './services/audit';
import { db, Candidate } from './services/database';
import { notifyHumanReview } from './services/slack';
import { SCORING, JOB_REQUIREMENTS } from './rubric';

export async function runPipeline(
  emailText: string,
  fromEmail: string,
  agents: any,
  jobId: string
) {
  const conversationId = `app-${Date.now()}`;
  let candidateName = 'Applicant';
  let candidateEmail = fromEmail;
  let candidateId: string | null = null;
  
  const scores: Record<string, number> = {
    intake: 0,
    research: 0,
    screener: 0,
  };

  console.log('\n' + '='.repeat(60));
  console.log(` ORCHESTRATOR: Pipeline started for ${fromEmail}`);
  console.log('='.repeat(60));

  // Helper: Instant Rejection
  const rejectNow = async (reason: string, stage: string, score: number) => {
    await auditLog({
      timestamp: new Date().toISOString(),
      candidate_name: candidateName,
      candidate_email: candidateEmail,
      stage,
      score,
      decision: 'REJECT',
      reasoning: reason,
      job_id: jobId,
    });

    if (candidateId) {
      await db.updateCandidate(candidateId, {
        status: 'REJECTED',
        current_stage: stage,
        rejection_reason: reason,
        processed_date: new Date().toISOString(),
        total_score: score,
      });
    }

    await mailCandidate(
      candidateEmail,
      `Application Update - ${JOB_REQUIREMENTS.title}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Application Status Update</h2>
          <p>Dear ${candidateName},</p>
          <p>Thank you for your interest in the <strong>${JOB_REQUIREMENTS.title}</strong> position at ${process.env.COMPANY_NAME}.</p>
          <p>After careful review, we have decided not to move forward with your application at this time.</p>
          <p>We appreciate the time you invested in applying and wish you the best in your job search.</p>
          <br>
          <p>Best regards,<br>${process.env.COMPANY_NAME} Recruiting Team</p>
        </div>
      `
    );

    await mailEmployer(
      `Application Rejected: ${candidateName}`,
      `
        <div style="font-family: Arial, sans-serif;">
          <h3>Candidate Rejected</h3>
          <p><strong>Name:</strong> ${candidateName}</p>
          <p><strong>Email:</strong> ${candidateEmail}</p>
          <p><strong>Stage:</strong> ${stage}</p>
          <p><strong>Score:</strong> ${score}/100</p>
          <p><strong>Reason:</strong> ${reason}</p>
        </div>
      `
    );

    console.log(`ORCHESTRATOR: REJECTED at ${stage} - ${reason}`);
  };

  try {
    // Notify employer of new application
    await mailEmployer(
      `New Application Received`,
      `
        <div style="font-family: Arial, sans-serif;">
          <h3>New Application</h3>
          <p>A new application has been received from <strong>${fromEmail}</strong></p>
          <p>Processing pipeline initiated...</p>
        </div>
      `
    );

    // STAGE 1: INTAKE
    console.log('\n--- STAGE 1: INTAKE ---');
    const intakeResult = await agents.intake.generateText(emailText, { conversationId });
    
    let candidate: any = {};
    try {
      const match = intakeResult.text.match(/\{[\s\S]*\}/);
      candidate = match ? JSON.parse(match[0]) : {};
    } catch (err) {
      console.error('Intake parsing failed:', err);
      await rejectNow('Failed to parse application', 'Intake', 0);
      return;
    }

    candidateName = candidate.name || fromEmail;
    candidateEmail = candidate.email || fromEmail;

    // Create candidate in database
    const candidateDoc = await db.createCandidate({
      ...candidate,
      intake_score: 0,
      research_score: 0,
      screener_score: 0,
      total_score: 0,
      status: 'PROCESSING',
      current_stage: 'Intake',
      application_date: new Date().toISOString(),
      job_id: jobId,
    } as Candidate);

    candidateId = candidateDoc.$id;

    // ORCHESTRATOR SCORES INTAKE
    let intakeScore = 0;

    // Portfolio/GitHub check (10 pts)
    if (candidate.has_portfolio || candidate.github_url) {
      intakeScore += SCORING.intake.weights.has_portfolio;
    }

    // Cover letter quality (10 pts)
    if (!candidate.cover_letter_is_generic && candidate.cover_letter_summary) {
      intakeScore += SCORING.intake.weights.cover_letter_quality;
    }

    // Skill match (10 pts)
    const matchedSkills = (candidate.skills || []).filter((s: string) =>
      JOB_REQUIREMENTS.required_skills.some((r) =>
        s.toLowerCase().includes(r.toLowerCase())
      )
    );

    if (matchedSkills.length >= JOB_REQUIREMENTS.required_skills.length) {
      intakeScore += SCORING.intake.weights.skill_match;
    } else if (matchedSkills.length > 0) {
      intakeScore += Math.round(
        (matchedSkills.length / JOB_REQUIREMENTS.required_skills.length) *
        SCORING.intake.weights.skill_match
      );
    }

    scores.intake = intakeScore;
    console.log(`ORCHESTRATOR: Intake Score = ${intakeScore}/${SCORING.intake.max}`);

    await db.updateCandidate(candidateId, {
      intake_score: intakeScore,
      current_stage: 'Intake Complete',
    });

    // Instant reject if score is 0
    if (intakeScore === 0) {
      await rejectNow('Failed intake requirements (no portfolio, generic application, no skill match)', 'Intake', 0);
      return;
    }

    // Check minimum experience
    if (candidate.experience_years < JOB_REQUIREMENTS.minimum_experience_years) {
      await rejectNow(
        `Insufficient experience (${candidate.experience_years} years, minimum ${JOB_REQUIREMENTS.minimum_experience_years} required)`,
        'Intake',
        intakeScore
      );
      return;
    }

    // STAGE 2: RESEARCHER
    console.log('\n--- STAGE 2: RESEARCHER ---');
    await db.updateCandidate(candidateId, { current_stage: 'Research' });

    const researchResult = await agents.researcher.generateText(
      JSON.stringify(candidate),
      { conversationId }
    );

    let research: any = {};
    try {
      const match = researchResult.text.match(/\{[\s\S]*\}/);
      research = match ? JSON.parse(match[0]) : {};
    } catch (err) {
      console.error('Research parsing failed:', err);
      research = { fluff_detected: true, github_active: false };
    }

    // ORCHESTRATOR SCORES RESEARCH
    let researchScore = 0;

    // No resume fluff (15 pts)
    if (!research.fluff_detected) {
      researchScore += SCORING.research.weights.no_resume_fluff;
    } else {
      // Partial credit based on fluff_score
      researchScore += Math.round(
        ((research.fluff_score || 0) / 100) * SCORING.research.weights.no_resume_fluff
      );
    }

    // GitHub activity (15 pts)
    if (research.github_active) {
      researchScore += Math.round(
        ((research.github_activity_score || 50) / 100) *
        SCORING.research.weights.github_activity
      );
    }

    scores.research = researchScore;
    console.log(`ORCHESTRATOR: Research Score = ${researchScore}/${SCORING.research.max}`);

    await db.updateCandidate(candidateId, {
      research_score: researchScore,
      current_stage: 'Research Complete',
    });

    // Instant reject if heavy fluff detected
    if (research.fluff_detected && (research.fluff_score || 0) < 30) {
      await rejectNow('Heavy resume fluff detected', 'Research', intakeScore + researchScore);
      return;
    }

    // STAGE 3: SCREENER
    console.log('\n--- STAGE 3: SCREENER ---');
    await db.updateCandidate(candidateId, { current_stage: 'Screener' });

    const screenerResult = await agents.screener.generateText(
      JSON.stringify({ candidate, research, job_requirements: JOB_REQUIREMENTS }),
      { conversationId }
    );

    let screener: any = {};
    try {
      const match = screenerResult.text.match(/\{[\s\S]*\}/);
      screener = match ? JSON.parse(match[0]) : {};
    } catch (err) {
      console.error('Screener parsing failed:', err);
      screener = { technical_depth_score: 0 };
    }

    // ORCHESTRATOR SCORES SCREENER
    const screenerScore = Math.round(
      ((screener.technical_depth_score || 0) / 100) *
      SCORING.screener.weights.technical_depth
    );

    scores.screener = screenerScore;
    console.log(`ORCHESTRATOR: Screener Score = ${screenerScore}/${SCORING.screener.max}`);

    await db.updateCandidate(candidateId, {
      screener_score: screenerScore,
      current_stage: 'Screener Complete',
    });

    // CALCULATE TOTAL SCORE
    const totalScore = scores.intake + scores.research + scores.screener;
    console.log(`\nORCHESTRATOR: TOTAL SCORE = ${totalScore}/100`);

    await db.updateCandidate(candidateId, {
      total_score: totalScore,
    });

    // Instant reject if total score < 40
    if (totalScore < SCORING.thresholds.auto_reject_below) {
      await rejectNow(`Total score too low (${totalScore}/100)`, 'Screener', totalScore);
      return;
    }

    // STAGE 4: JUDGE
    console.log('\n--- STAGE 4: JUDGE ---');
    await db.updateCandidate(candidateId, { current_stage: 'Judge' });

    const judgeResult = await agents.judge.generateText(
      JSON.stringify({ candidate, research, screener, totalScore, threshold: SCORING.thresholds }),
      { conversationId }
    );

    let judge: any = {};
    try {
      const match = judgeResult.text.match(/\{[\s\S]*\}/);
      judge = match ? JSON.parse(match[0]) : {};
    } catch (err) {
      console.error('Judge parsing failed:', err);
      judge = { decision: 'HUMAN_REVIEW' };
    }

    // ORCHESTRATOR MAKES FINAL DECISION
    let decision = judge.decision;

    // Override based on score if judge is uncertain
    if (!decision || !['PROCEED', 'REJECT', 'HUMAN_REVIEW'].includes(decision)) {
      if (totalScore >= SCORING.thresholds.auto_proceed) {
        decision = 'PROCEED';
      } else if (totalScore >= SCORING.thresholds.human_review[0]) {
        decision = 'HUMAN_REVIEW';
      } else {
        decision = 'REJECT';
      }
    }

    console.log(`ORCHESTRATOR: Judge Decision = ${decision}`);

    await auditLog({
      timestamp: new Date().toISOString(),
      candidate_name: candidateName,
      candidate_email: candidateEmail,
      stage: 'Judge',
      score: totalScore,
      decision,
      reasoning: judge.reasoning || 'Score-based decision',
      job_id: jobId,
    });

    // Handle REJECT
    if (decision === 'REJECT') {
      await rejectNow(
        judge.rejection_reason || `Score below threshold (${totalScore}/100)`,
        'Judge',
        totalScore
      );
      return;
    }

    // Handle HUMAN_REVIEW
    if (decision === 'HUMAN_REVIEW') {
      await db.updateCandidate(candidateId, {
        status: 'HUMAN_REVIEW',
        current_stage: 'Awaiting Human Review',
        decision: 'HUMAN_REVIEW',
        processed_date: new Date().toISOString(),
      });

      await notifyHumanReview(
        candidateName,
        candidateEmail,
        totalScore,
        judge.employer_summary || 'Borderline candidate requiring review',
        candidateId
      );

      await mailEmployer(
        `Human Review Required: ${candidateName} (${totalScore}/100)`,
        `
          <div style="font-family: Arial, sans-serif;">
            <h3>Borderline Candidate - Manual Review Needed</h3>
            <p><strong>Name:</strong> ${candidateName}</p>
            <p><strong>Email:</strong> ${candidateEmail}</p>
            <p><strong>Score:</strong> ${totalScore}/100</p>
            <hr>
            <p><strong>Summary:</strong></p>
            <p>${judge.employer_summary || 'Review required'}</p>
            <hr>
            <p><strong>Score Breakdown:</strong></p>
            <ul>
              <li>Intake: ${scores.intake}/${SCORING.intake.max}</li>
              <li>Research: ${scores.research}/${SCORING.research.max}</li>
              <li>Screener: ${scores.screener}/${SCORING.screener.max}</li>
            </ul>
            <p>Please review in Slack or chat interface.</p>
          </div>
        `
      );

      console.log('ORCHESTRATOR: Sent to HUMAN_REVIEW');
      return;
    }

    // Handle PROCEED
    if (decision === 'PROCEED') {
      console.log('\n--- STAGE 5: COORDINATOR ---');
      await db.updateCandidate(candidateId, {
        status: 'ACCEPTED',
        current_stage: 'Scheduling Interview',
        decision: 'PROCEED',
      });

      // Ask Coordinator to schedule
      const coordResult = await agents.coordinator.generateText(
        `Schedule interview for candidate: ${JSON.stringify({
          candidate_name: candidateName,
          candidate_email: candidateEmail,
        })}`,
        { conversationId }
      );

      let schedule: any = {};
      try {
        const match = coordResult.text.match(/\{[\s\S]*\}/);
        schedule = match ? JSON.parse(match[0]) : {};
      } catch (err) {
        console.error('Coordinator parsing failed:', err);
      }

      if (schedule.success) {
        await db.updateCandidate(candidateId, {
          interview_scheduled: true,
          interview_datetime: schedule.scheduled_at,
          interview_meet_link: schedule.meet_link,
          interview_event_link: schedule.event_link,
          current_stage: 'Interview Scheduled',
          processed_date: new Date().toISOString(),
        });

        // ORCHESTRATOR SENDS INTERVIEW INVITATION TO CANDIDATE
        await mailCandidate(
          candidateEmail,
          `Interview Invitation - ${JOB_REQUIREMENTS.title}`,
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Congratulations!</h2>
              <p>Dear ${candidateName},</p>
              <p>We are pleased to invite you for an interview for the <strong>${JOB_REQUIREMENTS.title}</strong> position.</p>
              <hr>
              <p><strong>Interview Details:</strong></p>
              <ul>
                <li><strong>Date & Time:</strong> ${schedule.formatted_time}</li>
                <li><strong>Duration:</strong> 30 minutes</li>
                <li><strong>Format:</strong> Video call via Google Meet</li>
              </ul>
              <p><strong>Join Meeting:</strong><br>
              <a href="${schedule.meet_link}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Join Google Meet</a></p>
              <p style="margin-top: 20px;">We look forward to speaking with you!</p>
              <br>
              <p>Best regards,<br>${process.env.COMPANY_NAME} Recruiting Team</p>
            </div>
          `
        );

        // ORCHESTRATOR SENDS BRIEF TO EMPLOYER
        await mailEmployer(
          `Interview Scheduled: ${candidateName} (${totalScore}/100)`,
          `
            <div style="font-family: Arial, sans-serif;">
              <h3>Interview Successfully Scheduled</h3>
              <p><strong>Candidate:</strong> ${candidateName}</p>
              <p><strong>Email:</strong> ${candidateEmail}</p>
              <p><strong>Total Score:</strong> ${totalScore}/100</p>
              <hr>
              <p><strong>Interview Details:</strong></p>
              <ul>
                <li><strong>Time:</strong> ${schedule.formatted_time}</li>
                <li><strong>Google Meet:</strong> <a href="${schedule.meet_link}">Join Meeting</a></li>
                <li><strong>Calendar Event:</strong> <a href="${schedule.event_link}">View in Calendar</a></li>
              </ul>
              <hr>
              <p><strong>Score Breakdown:</strong></p>
              <ul>
                <li>Intake: ${scores.intake}/${SCORING.intake.max}</li>
                <li>Research: ${scores.research}/${SCORING.research.max}</li>
                <li>Screener: ${scores.screener}/${SCORING.screener.max}</li>
              </ul>
              <p><strong>Summary:</strong></p>
              <p>${judge.employer_summary || 'Strong candidate'}</p>
              ${screener.interview_questions ? `
                <p><strong>Suggested Interview Questions:</strong></p>
                <ol>
                  ${screener.interview_questions.map((q: string) => `<li>${q}</li>`).join('')}
                </ol>
              ` : ''}
            </div>
          `
        );

        console.log('ORCHESTRATOR: Interview scheduled successfully');
      } else {
        // Scheduling failed
        await db.updateCandidate(candidateId, {
          current_stage: 'Scheduling Failed',
        });

        await mailEmployer(
          `Scheduling Failed: ${candidateName}`,
          `
            <div style="font-family: Arial, sans-serif;">
              <h3>Interview Scheduling Failed</h3>
              <p><strong>Candidate:</strong> ${candidateName} (${candidateEmail})</p>
              <p><strong>Error:</strong> ${schedule.error || 'Unknown error'}</p>
              <p>Please schedule manually.</p>
            </div>
          `
        );

        console.error('ORCHESTRATOR: Scheduling failed:', schedule.error);
      }
    }

  } catch (error: any) {
    console.error('ORCHESTRATOR: Pipeline error:', error);
    
    await mailEmployer(
      `Pipeline Error for ${candidateName}`,
      `
        <div style="font-family: Arial, sans-serif;">
          <h3>Processing Error</h3>
          <p><strong>Candidate:</strong> ${candidateName} (${candidateEmail})</p>
          <p><strong>Error:</strong> ${error.message}</p>
        </div>
      `
    );

    if (candidateId) {
      await db.updateCandidate(candidateId, {
        status: 'REJECTED',
        current_stage: 'Error',
        rejection_reason: `System error: ${error.message}`,
      });
    }
  }
}