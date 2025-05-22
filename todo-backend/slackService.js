require('dotenv').config();
const axios = require('axios');

async function sendSlackMessage(message) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error('Slack webhook URL is not defined in environment variables');
  }

  try {
    await axios.post(webhookUrl, { text: message });
  } catch (error) {
    console.error('Error sending Slack message:', error);
    throw error;
  }
}

module.exports = {
  sendSlackMessage,
};
