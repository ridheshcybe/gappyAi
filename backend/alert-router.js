async function routeIncident(incident) {
  /**
   * Based on severity, trigger different actions:
   * - P0: Send immediate Slack/email, page on-call
   * - P1: Create ticket, notify team
   * - P2/P3: Log for review
   */

  const { severity } = incident.classification;
  const { headline, userImpactDescription } = incident.triageAnalysis;

  switch (severity) {
    case 'P0_CRITICAL':
      console.log(`🚨 CRITICAL INCIDENT: ${headline}`);
      // TODO: Send urgent Slack notification
      // TODO: Page on-call engineer
      // TODO: Create incident in PagerDuty/Opsgenie
      break;

    case 'P1_HIGH':
      console.log(`⚠️  HIGH PRIORITY: ${headline}`);
      // TODO: Create GitHub issue
      // TODO: Notify team in Slack
      break;

    case 'P2_MEDIUM':
      console.log(`📋 MEDIUM PRIORITY: ${headline}`);
      // TODO: Log to incident dashboard
      break;

    case 'P3_LOW':
      console.log(`ℹ️  LOW PRIORITY: ${headline}`);
      // TODO: Archive for later review
      break;
  }

  return incident;
}

module.exports = { routeIncident };
