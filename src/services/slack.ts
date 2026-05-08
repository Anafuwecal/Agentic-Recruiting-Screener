import axios from 'axios';

export class SlackService {
  async sendReviewRequest(applicantId: string, candidate: any, judge: any, score: number) {
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Manual Review Required*\n\n*Candidate:* ${candidate.name}\n*Email:* ${candidate.email}\n*Score:* ${score}/100\n\n*Summary:* ${judge.employer_summary}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '✅ Approve' },
            style: 'primary',
            value: applicantId,
            action_id: 'approve',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '❌ Reject' },
            style: 'danger',
            value: applicantId,
            action_id: 'reject',
          },
        ],
      },
    ];

    await axios.post(process.env.SLACK_WEBHOOK_URL!, {
      blocks,
    });
  }
}