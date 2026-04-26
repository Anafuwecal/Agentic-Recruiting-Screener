import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
const CHANNEL_ID = process.env.SLACK_CHANNEL_ID!;

export async function notifyHumanReview(
  candidateName: string,
  candidateEmail: string,
  score: number,
  summary: string,
  candidateId: string
) {
  try {
    await slack.chat.postMessage({
      channel: CHANNEL_ID,
      text: `Human Review Needed: ${candidateName}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `Human Review Required: ${candidateName}`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Email:*\n${candidateEmail}`,
            },
            {
              type: 'mrkdwn',
              text: `*Score:*\n${score}/100`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Summary:*\n${summary}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Approve',
              },
              style: 'primary',
              value: candidateId,
              action_id: 'approve_candidate',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Reject',
              },
              style: 'danger',
              value: candidateId,
              action_id: 'reject_candidate',
            },
          ],
        },
      ],
    });
    console.log(`Slack notification sent for ${candidateName}`);
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
  }
}