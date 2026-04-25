import { SCORING } from '../config/rubric.js';
import {
  getActiveJobRequirement,
  createOrUpdateCandidate,
  createApplication,
  updateApplicationStatus,
  recordScore,
  logAudit,
  saveChatMessage,
  getAllCandidates,
} from '../database/queries.js';
import { sendEmailToEmployer, sendEmailToCandidate } from './mailer.js';
import { broadcastToEmployer } from './websocket.js';

export async function runRecruitmentPipeline(
  emailText: string,
  fromEmail: string,
  agents: any
) {
  const conversationId = `app-${Date.now()}`;
  let candidateName = 'Applicant';
  let candidateEmail = fromEmail;
  let candidateId: string | null = null;
  let applicationId: string | null = null;

  const scores: Record<string, number> = {};

  console.log(`\n${'='.repeat(70)}`);
  console.log(` ORCHESTRATOR: New application from ${fromEmail}`);
  console.log(`${'='.repeat(70)}`);

  const jobReq = await getActiveJobRequirement();
  if (!jobReq) {
    console.error('[ORCHESTRATOR] No active job requirement found');
    return;
  }

  const rejectCandidate = async (
    reason: string,
    stage: string,
    score: number
  ) => {
    console.log(`[ORCHESTRATOR] REJECTING at ${stage}: ${reason}`);

    if (candidateId && applicationId) {
      await updateApplicationStatus(applicationId, 'REJECTED', {
        rejectionReason: reason,
        finalDecision: 'REJECT',
        totalScore: score,
      });
    }

    await logAudit(candidateId, stage, 'REJECT', reason, 'REJECT');

    await sendEmailToCandidate(
      candidateEmail,
      `Application Update - ${jobReq.title}`,
      `<p>Dear ${candidateName},</p>
       <p>Thank you for your interest in the ${jobReq.title} position.</p>
       <p>After careful review, we have decided not to move forward with your application at this time.</p>
       <p>We appreciate your time and wish you the best in your job search.</p>
       <p>Best regards,<br>${process.env.COMPANY_NAME} Recruiting Team</p>`
    );

    await sendEmailToEmployer(
      `Rejected: ${candidateName} (${candidateEmail})`,
      `<h2>Application Rejected</h2>
       <p><strong>Candidate:</strong> ${candidateName}</p>
       <p><strong>Email:</strong> ${candidateEmail}</p>
       <p><strong>Stage:</strong> ${stage}</p>
       <p><strong>Score:</strong> ${score}/100</p>
       <p><strong>Reason:</strong> ${reason}</p>`
    );

    broadcastToEmployer('candidate_rejected', {
      name: candidateName,
      email: candidateEmail,
      stage,
      reason,
      score,
    });
  };

  try {
    await sendEmailToEmployer(
      `New Application Received`,
      `<h2>New Candidate</h2>
       <p><strong>Name:</strong> Processing...</p>
       <p><strong>Email:</strong> ${fromEmail}</p>
       <p>Screening in progress...</p>`
    );

    broadcastToEmployer('new_application', { email: fromEmail });

    console.log('\n[ORCHESTRATOR] STAGE 1: INTAKE');
    const intakeResult = await agents.intake.generateText(emailText, {
      conversationId,
    });

    let candidateData: any = {};
    try {
      const match = intakeResult.text.match(/\{[\s\S]*\}/);
      candidateData = match ? JSON.parse(match[0]) : {};
    } catch (err) {
      console.error('[ORCHESTRATOR] Failed to parse intake JSON');
      await rejectCandidate('Invalid application format', 'INTAKE', 0);
      return;
    }

    candidateName = candidateData.name || fromEmail;
    candidateEmail = candidateData.email || fromEmail;

    const candidate = await createOrUpdateCandidate({
      name: candidateName,
      email: candidateEmail,
      phone: candidateData.phone,
      githubUrl: candidateData.github_url,
      githubUsername: candidateData.github_username,
      portfolioUrl: candidateData.portfolio_url,
      linkedinUrl: candidateData.linkedin_url,
      skills: candidateData.skills || [],
      experienceYears: candidateData.experience_years || 0,
      education: candidateData.education,
      previousRoles: candidateData.previous_roles || [],
      rawEmailText: emailText,
    });

    candidateId = candidate.id;

    const application = await createApplication(candidateId, {
      coverLetterSummary: candidateData.cover_letter_summary,
      hasPortfolio: candidateData.has_portfolio || false,
      coverLetterIsGeneric: candidateData.cover_letter_is_generic || true,
      status: 'PROCESSING',
    });

    applicationId = application.id;

    let intakeScore = 0;
    const intakeBreakdown: any = {};

    if (
      candidateData.has_portfolio ||
      candidateData.github_url ||
      candidateData.portfolio_url
    ) {
      intakeScore += SCORING.intake.weights.has_portfolio;
      intakeBreakdown.portfolio = SCORING.intake.weights.has_portfolio;
    }

    if (!candidateData.cover_letter_is_generic) {
      intakeScore += SCORING.intake.weights.cover_letter_quality;
      intakeBreakdown.cover_letter = SCORING.intake.weights.cover_letter_quality;
    }

    const matchedSkills = (candidateData.skills || []).filter((s: string) =>
      jobReq.requiredSkills.some((r) =>
        s.toLowerCase().includes(r.toLowerCase())
      )
    );

    if (matchedSkills.length > 0) {
      intakeScore += SCORING.intake.weights.skill_match;
      intakeBreakdown.skill_match = SCORING.intake.weights.skill_match;
    }

    scores.intake = intakeScore;

    await recordScore(
      candidateId,
      'INTAKE',
      intakeScore,
      SCORING.intake.max,
      intakeBreakdown,
      `Matched ${matchedSkills.length} required skills`
    );

    console.log(
      `[ORCHESTRATOR] Intake Score: ${intakeScore}/${SCORING.intake.max}`
    );

    if (candidateData.experience_years < jobReq.minimumExperienceYears) {
      await rejectCandidate(
        `Insufficient experience: ${candidateData.experience_years} years (min ${jobReq.minimumExperienceYears})`,
        'INTAKE',
        intakeScore
      );
      return;
    }

    if (matchedSkills.length === 0) {
      await rejectCandidate(
        'No matching required skills found',
        'INTAKE',
        intakeScore
      );
      return;
    }

    console.log('\n[ORCHESTRATOR] STAGE 2: RESEARCH');
    const researchResult = await agents.researcher.generateText(
      JSON.stringify(candidateData),
      { conversationId }
    );

    let researchData: any = {};
    try {
      const match = researchResult.text.match(/\{[\s\S]*\}/);
      researchData = match ? JSON.parse(match[0]) : {};
    } catch (err) {
      console.error('[ORCHESTRATOR] Failed to parse research JSON');
    }

    let researchScore = 0;
    const researchBreakdown: any = {};

    if (!researchData.fluff_detected) {
      researchScore += SCORING.research.weights.no_resume_fluff;
      researchBreakdown.no_fluff = SCORING.research.weights.no_resume_fluff;
    }

    if (researchData.github_active) {
      const githubPoints = Math.round(
        ((researchData.github_activity_score || 50) / 100) *
          SCORING.research.weights.github_activity
      );
      researchScore += githubPoints;
      researchBreakdown.github = githubPoints;
    }

    scores.research = researchScore;

    await recordScore(
      candidateId,
      'RESEARCH',
      researchScore,
      SCORING.research.max,
      researchBreakdown,
      researchData.summary || 'Verification complete'
    );

    console.log(
      `[ORCHESTRATOR] Research Score: ${researchScore}/${SCORING.research.max}`
    );

    if (researchData.fluff_detected && researchData.fluff_score < 30) {
      await rejectCandidate(
        `Heavy resume fluff detected: ${researchData.fluff_examples?.join(', ')}`,
        'RESEARCH',
        scores.intake + researchScore
      );
      return;
    }

    console.log('\n[ORCHESTRATOR] STAGE 3: SCREENER');
    const screenerResult = await agents.screener.generateText(
      JSON.stringify({ candidate: candidateData, research: researchData }),
      { conversationId }
    );

    let screenerData: any = {};
    try {
      const match = screenerResult.text.match(/\{[\s\S]*\}/);
      screenerData = match ? JSON.parse(match[0]) : {};
    } catch (err) {
      console.error('[ORCHESTRATOR] Failed to parse screener JSON');
    }

    const screenerScore = Math.round(
      ((screenerData.technical_depth_score || 0) / 100) *
        SCORING.screener.weights.technical_depth
    );

    scores.screener = screenerScore;

    await recordScore(
      candidateId,
      'SCREENER',
      screenerScore,
      SCORING.screener.max,
      {
        technical_depth: screenerData.technical_depth_score,
        strengths: screenerData.strengths,
        weaknesses: screenerData.weaknesses,
      },
      screenerData.summary || 'Technical screening complete'
    );

    console.log(
      `[ORCHESTRATOR] Screener Score: ${screenerScore}/${SCORING.screener.max}`
    );

    const totalScore = scores.intake + scores.research + scores.screener;
    console.log(`\n[ORCHESTRATOR] TOTAL SCORE: ${totalScore}/100`);

    await updateApplicationStatus(applicationId, 'PROCESSING', {
      totalScore,
    });

    console.log('\n[ORCHESTRATOR] STAGE 4: JUDGE');
    const judgeResult = await agents.judge.generateText(
      JSON.stringify({
        candidate: candidateData,
        research: researchData,
        screener: screenerData,
        totalScore,
      }),
      { conversationId }
    );

    let judgeData: any = {};
    try {
      const match = judgeResult.text.match(/\{[\s\S]*\}/);
      judgeData = match ? JSON.parse(match[0]) : {};
    } catch (err) {
      console.error('[ORCHESTRATOR] Failed to parse judge JSON');
    }

    let finalDecision = judgeData.decision;
    if (!finalDecision) {
      if (totalScore >= SCORING.thresholds.auto_proceed) {
        finalDecision = 'PROCEED';
      } else if (totalScore >= SCORING.thresholds.human_review[0]) {
        finalDecision = 'HUMAN_REVIEW';
      } else {
        finalDecision = 'REJECT';
      }
    }

    console.log(`[ORCHESTRATOR] Judge Decision: ${finalDecision}`);

    await logAudit(
      candidateId,
      'JUDGE',
      'DECISION',
      judgeData.reasoning || 'Decision made',
      finalDecision
    );

    if (finalDecision === 'REJECT') {
      await rejectCandidate(
        judgeData.rejection_reason || 'Did not meet requirements',
        'JUDGE',
        totalScore
      );
      return;
    }

    if (finalDecision === 'HUMAN_REVIEW') {
      console.log('[ORCHESTRATOR] Sending to human review');

      await updateApplicationStatus(applicationId, 'HUMAN_REVIEW', {
        finalDecision: 'HUMAN_REVIEW',
        totalScore,
      });

      await sendEmailToEmployer(
        `Human Review Required: ${candidateName} (Score: ${totalScore}/100)`,
        `<h2>Borderline Candidate</h2>
         <p><strong>Candidate:</strong> ${candidateName}</p>
         <p><strong>Email:</strong> ${candidateEmail}</p>
         <p><strong>Total Score:</strong> ${totalScore}/100</p>
         <p><strong>Breakdown:</strong></p>
         <ul>
           <li>Intake: ${scores.intake}/${SCORING.intake.max}</li>
           <li>Research: ${scores.research}/${SCORING.research.max}</li>
           <li>Screener: ${scores.screener}/${SCORING.screener.max}</li>
         </ul>
         <p><strong>Summary:</strong> ${judgeData.employer_summary || 'Review required'}</p>
         <p>Please review in the dashboard and approve or reject.</p>`
      );

      broadcastToEmployer('human_review_needed', {
        candidateId,
        applicationId,
        name: candidateName,
        email: candidateEmail,
        score: totalScore,
        breakdown: scores,
      });

      return;
    }

    if (finalDecision === 'PROCEED') {
      console.log('\n[ORCHESTRATOR] STAGE 5: COORDINATOR');

      const coordResult = await agents.coordinator.generateText(
        `Schedule interview for ${candidateName} (${candidateEmail})`,
        { conversationId }
      );

      let scheduleData: any = {};
      try {
        const match = coordResult.text.match(/\{[\s\S]*\}/);
        scheduleData = match ? JSON.parse(match[0]) : {};
      } catch (err) {
        console.error('[ORCHESTRATOR] Failed to parse coordinator JSON');
      }

      if (scheduleData.status === 'SUCCESS') {
        await updateApplicationStatus(applicationId, 'ACCEPTED', {
          finalDecision: 'ACCEPT',
          totalScore,
          scheduledAt: new Date(scheduleData.scheduled_at),
          meetLink: scheduleData.meet_link,
          eventLink: scheduleData.event_link,
        });

        console.log(
          `[ORCHESTRATOR] Interview scheduled for ${new Date(
            scheduleData.scheduled_at
          ).toLocaleString()}`
        );

        await sendEmailToCandidate(
          candidateEmail,
          `Interview Invitation - ${jobReq.title}`,
          `<p>Dear ${candidateName},</p>
           <p>Congratulations! We are pleased to invite you for an interview.</p>
           <p><strong>Position:</strong> ${jobReq.title}</p>
           <p><strong>Date & Time:</strong> ${new Date(
             scheduleData.scheduled_at
           ).toLocaleString()}</p>
           <p><strong>Google Meet Link:</strong> <a href="${
             scheduleData.meet_link
           }">${scheduleData.meet_link}</a></p>
           <p>We look forward to speaking with you!</p>
           <p>Best regards,<br>${process.env.COMPANY_NAME} Recruiting Team</p>`
        );

        await sendEmailToEmployer(
          `Interview Scheduled: ${candidateName} (Score: ${totalScore}/100)`,
          `<h2>Interview Confirmed</h2>
           <p><strong>Candidate:</strong> ${candidateName}</p>
           <p><strong>Email:</strong> ${candidateEmail}</p>
           <p><strong>Total Score:</strong> ${totalScore}/100</p>
           <p><strong>Interview Time:</strong> ${new Date(
             scheduleData.scheduled_at
           ).toLocaleString()}</p>
           <p><strong>Google Meet:</strong> <a href="${
             scheduleData.meet_link
           }">Join Meeting</a></p>
           <p><strong>Calendar Event:</strong> <a href="${
             scheduleData.event_link
           }">View Event</a></p>
           <h3>Technical Questions Prepared:</h3>
           <ol>
             ${screenerData.interview_questions
               ?.map((q: string) => `<li>${q}</li>`)
               .join('') || '<li>None generated</li>'}
           </ol>`
        );

        broadcastToEmployer('interview_scheduled', {
          candidateId,
          applicationId,
          name: candidateName,
          email: candidateEmail,
          score: totalScore,
          scheduledAt: scheduleData.scheduled_at,
          meetLink: scheduleData.meet_link,
        });

        await logAudit(
          candidateId,
          'COORDINATOR',
          'SCHEDULE_SUCCESS',
          `Interview scheduled for ${new Date(
            scheduleData.scheduled_at
          ).toLocaleString()}`,
          'ACCEPT'
        );
      } else {
        console.error(
          '[ORCHESTRATOR] Scheduling failed:',
          scheduleData.error
        );
        await logAudit(
          candidateId,
          'COORDINATOR',
          'SCHEDULE_FAILED',
          scheduleData.error || 'Unknown error',
          'ERROR'
        );

        await sendEmailToEmployer(
          `Scheduling Failed for ${candidateName}`,
          `<p>Could not schedule interview automatically.</p>
           <p>Error: ${scheduleData.error}</p>
           <p>Please schedule manually via chat UI.</p>`
        );
      }
    }

    console.log(`\n[ORCHESTRATOR] Pipeline complete for ${candidateName}\n`);
  } catch (err: any) {
    console.error('[ORCHESTRATOR] Pipeline error:', err);
    await logAudit(
      candidateId,
      'SYSTEM',
      'ERROR',
      err.message || 'Unknown error',
      'ERROR'
    );
  }
}

export async function handleEmployerChatMessage(
  message: string,
  llm: any,
  agents: any
) {
  const { saveChatMessage } = await import('./database');

  await saveChatMessage('EMPLOYER', message);

  const Agent = (await import('@voltagent/core')).Agent;

  const orchestratorChatAgent = new Agent({
    name: 'Orchestrator Chat',
    description: 'Handles employer queries about recruitment pipeline.',
    llm,
    model: 'llama-3.3-70b-versatile',
    instructions: `
      You are the Orchestrator AI managing the recruitment pipeline.
      The employer can ask you:
      - Status of specific candidates
      - List of all applications
      - Scores and reasoning
      - Manual actions (e.g., "Schedule interview for john@example.com at 3pm tomorrow")
      
      You have access to the database and can:
      - Query candidate information
      - Update application statuses
      - Trigger scheduling with custom times/links
      - Explain decisions
      
      Always be professional and concise.
      If asked to perform an action, confirm it clearly.
    `,
  });

  const context = await buildChatContext();

  const response = await orchestratorChatAgent.generateText(
    `${context}\n\nEmployer: ${message}`,
    { conversationId: 'chat-session' }
  );

  await saveChatMessage('ORCHESTRATOR', response.text);

  return response.text;
}

async function buildChatContext() {
  const candidates = await prisma.candidate.findMany({
    include: {
      applications: true,
      scores: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return `
Current candidates (last 10):
${candidates
  .map(
    (c) => `
- ${c.name} (${c.email})
  Status: ${c.applications[0]?.status || 'N/A'}
  Total Score: ${c.applications[0]?.totalScore || 0}/100
  Created: ${c.createdAt.toLocaleString()}
`
  )
  .join('\n')}
`;
}