import { db } from './services/database';
import { mailCandidate } from './services/mailer';
import { JOB_REQUIREMENTS, updateJobRequirements } from './rubric';

export async function handleEmployerMessage(message: string): Promise<string> {
  const timestamp = new Date().toISOString();
  
  // Save employer message
  await db.saveChatMessage({
    sender: 'EMPLOYER',
    message,
    timestamp,
  });

  // Parse employer intent
  const lowerMessage = message.toLowerCase();
  let response = '';

  try {
    // Query about candidates
    if (lowerMessage.includes('candidate') || lowerMessage.includes('applicant')) {
      if (lowerMessage.includes('how many') || lowerMessage.includes('count')) {
        const candidates = await db.listCandidates();
        const statusCounts = {
          NEW: 0,
          PROCESSING: 0,
          ACCEPTED: 0,
          REJECTED: 0,
          HUMAN_REVIEW: 0,
        };
        
        candidates.forEach((c: any) => {
          statusCounts[c.status as keyof typeof statusCounts]++;
        });

        response = `Current candidate statistics:\n
- Total Applications: ${candidates.length}
- Processing: ${statusCounts.PROCESSING}
- Accepted: ${statusCounts.ACCEPTED}
- Rejected: ${statusCounts.REJECTED}
- Awaiting Your Review: ${statusCounts.HUMAN_REVIEW}`;
      }
      else if (lowerMessage.includes('list') || lowerMessage.includes('show')) {
        if (lowerMessage.includes('accepted')) {
          const candidates = await db.listCandidates(undefined, 'ACCEPTED');
          if (candidates.length === 0) {
            response = 'No accepted candidates yet.';
          } else {
            response = 'Accepted Candidates:\n\n' + candidates.map((c: any) => 
              `- ${c.name} (${c.email}) - Score: ${c.total_score}/100 - ${c.interview_scheduled ? 'Interview Scheduled' : 'Pending Schedule'}`
            ).join('\n');
          }
        }
        else if (lowerMessage.includes('review') || lowerMessage.includes('pending')) {
          const candidates = await db.listCandidates(undefined, 'HUMAN_REVIEW');
          if (candidates.length === 0) {
            response = 'No candidates awaiting review.';
          } else {
            response = 'Candidates Awaiting Your Review:\n\n' + candidates.map((c: any) => 
              `- ${c.name} (${c.email}) - Score: ${c.total_score}/100 - Stage: ${c.current_stage}`
            ).join('\n');
          }
        }
        else {
          const candidates = await db.listCandidates();
          const recent = candidates.slice(0, 10);
          response = `Recent Applications (last 10):\n\n` + recent.map((c: any) => 
            `- ${c.name} (${c.email}) - Status: ${c.status} - Score: ${c.total_score}/100`
          ).join('\n');
        }
      }
      else if (lowerMessage.includes('score')) {
        // Extract candidate identifier
        const candidates = await db.listCandidates();
        const words = message.split(' ');
        
        // Try to find candidate by name or email in message
        const candidate = candidates.find((c: any) => {
          const nameMatch = words.some(w => c.name.toLowerCase().includes(w.toLowerCase()));
          const emailMatch = words.some(w => c.email.toLowerCase().includes(w.toLowerCase()));
          return nameMatch || emailMatch;
        });

        if (candidate) {
          response = `Score details for ${candidate.name}:\n
- Intake Score: ${candidate.intake_score}/30
- Research Score: ${candidate.research_score}/30
- Screener Score: ${candidate.screener_score}/40
- Total Score: ${candidate.total_score}/100
- Status: ${candidate.status}
- Current Stage: ${candidate.current_stage}`;
        } else {
          response = 'Could not identify which candidate you are referring to. Please provide their name or email.';
        }
      }
    }
    
    // Manual interview scheduling
    else if (lowerMessage.includes('schedule') || lowerMessage.includes('interview')) {
      // Extract meet link if provided
      const meetLinkMatch = message.match(/(https:\/\/meet\.google\.com\/[a-z-]+)/i);
      const dateMatch = message.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/);
      const timeMatch = message.match(/(\d{1,2}:\d{2}\s*(am|pm)?)/i);
      
      if (meetLinkMatch && dateMatch && timeMatch) {
        const meetLink = meetLinkMatch[1];
        const dateStr = dateMatch[1];
        const timeStr = timeMatch[1];
        
        // Extract candidate
        const candidates = await db.listCandidates();
        const words = message.split(' ');
        
        const candidate = candidates.find((c: any) => {
          const nameMatch = words.some(w => c.name.toLowerCase().includes(w.toLowerCase()));
          const emailMatch = words.some(w => c.email.toLowerCase().includes(w.toLowerCase()));
          return nameMatch || emailMatch;
        });

        if (candidate) {
          const scheduledAt = new Date(`${dateStr} ${timeStr}`).toISOString();
          
          await db.updateCandidate(candidate.$id, {
            interview_scheduled: true,
            interview_datetime: scheduledAt,
            interview_meet_link: meetLink,
            status: 'ACCEPTED',
            current_stage: 'Interview Scheduled (Manual)',
          });

          await mailCandidate(
            candidate.email,
            `Interview Invitation - ${JOB_REQUIREMENTS.title}`,
            `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Interview Scheduled</h2>
                <p>Dear ${candidate.name},</p>
                <p>Your interview has been scheduled:</p>
                <p><strong>Date & Time:</strong> ${new Date(scheduledAt).toLocaleString()}</p>
                <p><strong>Meeting Link:</strong><br>
                <a href="${meetLink}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Join Google Meet</a></p>
                <p>We look forward to speaking with you!</p>
                <br>
                <p>Best regards,<br>${process.env.COMPANY_NAME} Recruiting Team</p>
              </div>
            `
          );

          response = `Interview scheduled for ${candidate.name}:\n- Date/Time: ${new Date(scheduledAt).toLocaleString()}\n- Meet Link: ${meetLink}\n- Invitation email sent to candidate.`;
        } else {
          response = 'Please specify the candidate name or email to schedule the interview for.';
        }
      } else {
        response = 'To manually schedule an interview, provide:\n- Candidate name or email\n- Date (YYYY-MM-DD)\n- Time (HH:MM AM/PM)\n- Google Meet link\n\nExample: "Schedule interview for John Doe on 2025-02-15 at 2:00 PM with https://meet.google.com/abc-defg-hij"';
      }
    }
    
    // Job configuration
    else if (lowerMessage.includes('job') && (lowerMessage.includes('edit') || lowerMessage.includes('update') || lowerMessage.includes('change'))) {
      response = `Current job configuration:\n
Title: ${JOB_REQUIREMENTS.title}
Required Skills: ${JOB_REQUIREMENTS.required_skills.join(', ')}
Nice-to-Have: ${JOB_REQUIREMENTS.nice_to_have.join(', ')}
Minimum Experience: ${JOB_REQUIREMENTS.minimum_experience_years} years
Portfolio Required: ${JOB_REQUIREMENTS.portfolio_required ? 'Yes' : 'No'}

To update, please use the Job Settings panel in the UI, or tell me specifically what you want to change.`;
    }
    
    // Approve/Reject candidate
    else if (lowerMessage.includes('approve') || lowerMessage.includes('accept')) {
      const candidates = await db.listCandidates(undefined, 'HUMAN_REVIEW');
      const words = message.split(' ');
      
      const candidate = candidates.find((c: any) => {
        const nameMatch = words.some(w => c.name.toLowerCase().includes(w.toLowerCase()));
        const emailMatch = words.some(w => c.email.toLowerCase().includes(w.toLowerCase()));
        return nameMatch || emailMatch;
      });

      if (candidate) {
        await db.updateCandidate(candidate.$id, {
          status: 'ACCEPTED',
          decision: 'PROCEED',
          current_stage: 'Approved by Employer',
        });

        response = `${candidate.name} has been approved. Would you like me to schedule an interview automatically, or will you schedule it manually?`;
      } else {
        response = 'Please specify which candidate to approve (from those awaiting review).';
      }
    }
    
    else if (lowerMessage.includes('reject')) {
      const candidates = await db.listCandidates(undefined, 'HUMAN_REVIEW');
      const words = message.split(' ');
      
      const candidate = candidates.find((c: any) => {
        const nameMatch = words.some(w => c.name.toLowerCase().includes(w.toLowerCase()));
        const emailMatch = words.some(w => c.email.toLowerCase().includes(w.toLowerCase()));
        return nameMatch || emailMatch;
      });

      if (candidate) {
        await db.updateCandidate(candidate.$id, {
          status: 'REJECTED',
          decision: 'REJECT',
          rejection_reason: 'Rejected by employer after review',
          current_stage: 'Rejected by Employer',
        });

        await mailCandidate(
          candidate.email,
          `Application Update - ${JOB_REQUIREMENTS.title}`,
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Application Status Update</h2>
              <p>Dear ${candidate.name},</p>
              <p>Thank you for your interest in the ${JOB_REQUIREMENTS.title} position.</p>
              <p>After careful consideration, we have decided not to move forward with your application at this time.</p>
              <p>We appreciate your time and wish you success in your job search.</p>
              <br>
              <p>Best regards,<br>${process.env.COMPANY_NAME} Recruiting Team</p>
            </div>
          `
        );

        response = `${candidate.name} has been rejected. Rejection email sent to candidate.`;
      } else {
        response = 'Please specify which candidate to reject.';
      }
    }
    
    // New applications
    else if (lowerMessage.includes('new') || lowerMessage.includes('recent')) {
      const candidates = await db.listCandidates();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const newToday = candidates.filter((c: any) => 
        new Date(c.application_date) >= today
      );

      if (newToday.length === 0) {
        response = 'No new applications today.';
      } else {
        response = `New applications today (${newToday.length}):\n\n` + newToday.map((c: any) => 
          `- ${c.name} (${c.email}) - Status: ${c.status} - Score: ${c.total_score}/100`
        ).join('\n');
      }
    }
    
    // Help/General query
    else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      response = `I am your Recruitment Orchestrator. I can help you with:

1. Candidate Information:
   - "How many candidates?" - Get statistics
   - "List accepted candidates" - Show accepted applicants
   - "Show candidates awaiting review" - List pending reviews
   - "What is [name]'s score?" - Get detailed scoring

2. Interview Management:
   - "Schedule interview for [name] on [date] at [time] with [meet link]"
   - Manual interview scheduling

3. Candidate Decisions:
   - "Approve [name]" - Accept a candidate in review
   - "Reject [name]" - Reject a candidate in review

4. Job Configuration:
   - "Show job settings" - View current job requirements
   - Update via UI or specific instructions

5. Application Status:
   - "Any new applications?" - Check recent submissions

How can I assist you today?`;
    }
    
    // Default response
    else {
      response = 'I understand you are asking about the recruitment process. Could you please be more specific? Ask "help" to see what I can do for you.';
    }

  } catch (error: any) {
    console.error('Chat handler error:', error);
    response = `I encountered an error processing your request: ${error.message}. Please try again or rephrase your question.`;
  }

  // Save orchestrator response
  await db.saveChatMessage({
    sender: 'ORCHESTRATOR',
    message: response,
    timestamp: new Date().toISOString(),
  });

  return response;
}