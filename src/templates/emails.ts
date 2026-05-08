export const newApplicationTemplate = (data: any) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; }
    .info-row { margin: 10px 0; }
    .label { font-weight: bold; color: #555; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 New Application Received</h1>
    </div>
    <div class="content">
      <p>A new candidate has applied and is being processed by the AI recruitment system.</p>
      
      <div class="info-row">
        <span class="label">Name:</span> ${data.name}
      </div>
      <div class="info-row">
        <span class="label">Email:</span> ${data.email}
      </div>
      <div class="info-row">
        <span class="label">Phone:</span> ${data.phone || 'Not provided'}
      </div>
      <div class="info-row">
        <span class="label">GitHub:</span> <a href="${data.github_url}">${data.github_url}</a>
      </div>
      <div class="info-row">
        <span class="label">Portfolio:</span> <a href="${data.portfolio_url}">${data.portfolio_url}</a>
      </div>
      <div class="info-row">
        <span class="label">Skills:</span> ${data.skills?.join(', ') || 'Not specified'}
      </div>
      <div class="info-row">
        <span class="label">Experience:</span> ${data.experience || 'Not specified'}
      </div>
      
      <p><strong>Cover Letter Summary:</strong></p>
      <p style="background: white; padding: 15px; border-left: 4px solid #4CAF50;">
        ${data.cover_letter_summary}
      </p>
      
      <p style="margin-top: 20px; font-size: 14px; color: #666;">
        ⏳ The AI agents are now verifying claims and assessing technical fit. 
        You'll receive another email when the process is complete.
      </p>
    </div>
    <div class="footer">
      AI-Powered Recruitment Screener | Automated by VoltAgent
    </div>
  </div>
</body>
</html>
`;

export const interviewScheduledTemplate = (candidate: any, meeting: any, judge: any) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; }
    .score-box { background: #4CAF50; color: white; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px; }
    .button { display: inline-block; background: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    .questions { background: white; padding: 15px; margin: 15px 0; }
    .question { margin: 10px 0; padding: 10px; background: #f0f0f0; border-left: 3px solid #2196F3; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Interview Scheduled - Strong Candidate</h1>
    </div>
    <div class="content">
      <div class="score-box">
        <h2 style="margin: 0;">Score: ${judge.total_score}/100</h2>
        <p style="margin: 5px 0;">Auto-Approved</p>
      </div>
      
      <h3>Candidate: ${candidate.name}</h3>
      <p><strong>Email:</strong> ${candidate.email}</p>
      <p><strong>GitHub:</strong> <a href="${candidate.github_url}">${candidate.github_url}</a></p>
      
      <h3>AI Assessment Summary:</h3>
      <p>${judge.employer_summary}</p>
      
      <h3>Interview Details:</h3>
      <p><strong>📅 Date & Time:</strong> ${new Date(meeting.scheduled_time).toLocaleString()}</p>
      <p><strong>🎥 Google Meet Link:</strong> <a href="${meeting.meeting_link}">${meeting.meeting_link}</a></p>
      <p><strong>📆 Calendar Event:</strong> <a href="${meeting.event_link}">Add to Calendar</a></p>
      
      <h3>Suggested Interview Questions:</h3>
      <div class="questions">
        ${meeting.questions?.map((q: any, i: number) => `
          <div class="question">
            <strong>Q${i + 1} (${q.skill_area}):</strong> ${q.question}
          </div>
        `).join('') || '<p>Questions will be provided in the screening report.</p>'}
      </div>
      
      <center>
        <a href="${meeting.meeting_link}" class="button">Join Interview (when time comes)</a>
      </center>
      
      <p style="margin-top: 20px; font-size: 12px; color: #666;">
        💡 The candidate has also been notified and will receive the same Google Meet link.
      </p>
    </div>
  </div>
</body>
</html>
`;

export const candidateInterviewTemplate = (candidate: any, meeting: any) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; }
    .highlight { background: #fff3cd; padding: 15px; margin: 15px 0; border-left: 4px solid #ffc107; }
    .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Congratulations ${candidate.name}!</h1>
    </div>
    <div class="content">
      <p>Great news! Your application has been reviewed and we'd like to invite you for an interview.</p>
      
      <h3>Interview Details:</h3>
      <div class="highlight">
        <p><strong>📅 Date & Time:</strong> ${new Date(meeting.scheduled_time).toLocaleString()}</p>
        <p><strong>⏱️ Duration:</strong> 30 minutes</p>
        <p><strong>🎥 Platform:</strong> Google Meet</p>
      </div>
      
      <center>
        <a href="${meeting.meeting_link}" class="button">Join Google Meet</a>
        <br>
        <a href="${meeting.event_link}" class="button" style="background: #2196F3;">Add to Calendar</a>
      </center>
      
      <h3>Preparation Tips:</h3>
      <ul>
        <li>✅ Test your camera and microphone before the interview</li>
        <li>✅ Have your GitHub and portfolio ready to share</li>
        <li>✅ Prepare to discuss your recent projects in detail</li>
        <li>✅ Review the job description and requirements</li>
      </ul>
      
      <p style="margin-top: 20px;">
        If you need to reschedule, please reply to this email at least 24 hours in advance.
      </p>
      
      <p>We're looking forward to speaking with you!</p>
      
      <p style="font-size: 12px; color: #666; margin-top: 30px;">
        <strong>Meeting Link:</strong> <a href="${meeting.meeting_link}">${meeting.meeting_link}</a><br>
        (This link will work when the interview time arrives)
      </p>
    </div>
  </div>
</body>
</html>
`;

export const humanReviewTemplate = (candidate: any, judge: any, score: number) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; }
    .score-box { background: #FF9800; color: white; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px; }
    .button { display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 5px; color: white; }
    .approve { background: #4CAF50; }
    .reject { background: #f44336; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Manual Review Required</h1>
    </div>
    <div class="content">
      <div class="score-box">
        <h2 style="margin: 0;">Score: ${score}/100</h2>
        <p style="margin: 5px 0;">Borderline Candidate</p>
      </div>
      
      <h3>Candidate: ${candidate.name}</h3>
      <p><strong>Email:</strong> ${candidate.email}</p>
      <p><strong>GitHub:</strong> <a href="${candidate.github_url}">${candidate.github_url}</a></p>
      <p><strong>Portfolio:</strong> <a href="${candidate.portfolio_url}">${candidate.portfolio_url}</a></p>
      
      <h3>AI Assessment:</h3>
      <p>${judge.employer_summary}</p>
      
      <h3>Reasoning:</h3>
      <p>${judge.reasoning}</p>
      
      <p style="margin-top: 30px;">
        <strong>Action Required:</strong> Please review this candidate's profile and decide whether to proceed with an interview.
      </p>
      
      <p style="font-size: 12px; color: #666;">
        💡 You can approve/reject via Slack or by replying to this email with "APPROVE" or "REJECT".
      </p>
    </div>
  </div>
</body>
</html>
`;

export const rejectionTemplate = (candidate: any) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #607D8B; color: white; padding: 20px; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Application Update</h1>
    </div>
    <div class="content">
      <p>Dear ${candidate.name},</p>
      
      <p>Thank you for taking the time to apply for the position at our company.</p>
      
      <p>After careful review of your application, we have decided to move forward with other candidates whose experience more closely matches our current needs.</p>
      
      <p>We appreciate your interest in our company and encourage you to apply for future openings that match your skills and experience.</p>
      
      <p>We wish you the best in your job search.</p>
      
      <p style="margin-top: 30px;">
        Best regards,<br>
        The Hiring Team
      </p>
    </div>
  </div>
</body>
</html>
`;