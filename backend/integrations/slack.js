const {
  IncomingWebhook,
} = require("@slack/webhook");

const webhook =
  new IncomingWebhook(
    process.env.SLACK_WEBHOOK_URL
  );

async function notify(
  incident
) {
  await webhook.send({
    text:
      `🚨 ${incident.classification.severity}\n` +
      `${incident.triageAnalysis.headline}`,
  });
}

module.exports = {
  notify,
};