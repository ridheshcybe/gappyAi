async function routeIncident(incident) {
  const { severity } = incident.classification;
  const { headline } = incident.triageAnalysis;
  const incidentId = incident.incidentId || incident.id;

  switch (severity) {
    case 'P0_CRITICAL':
      console.log(`🚨 CRITICAL INCIDENT: ${headline} [${incidentId}]`);
      break;

    case 'P1_HIGH':
      console.log(`⚠️  HIGH PRIORITY: ${headline} [${incidentId}]`);
      break;

    case 'P2_MEDIUM':
      console.log(`📋 MEDIUM PRIORITY: ${headline} [${incidentId}]`);
      break;

    case 'P3_LOW':
      console.log(`ℹ️  LOW PRIORITY: ${headline} [${incidentId}]`);
      break;
  }

  return incident;
}

export default { routeIncident };
