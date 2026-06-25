const runbookTemplates = {
  'Database': [
    'Check database connection pool status and active connections',
    'Review recent slow queries using database profiler',
    'Check disk space and memory usage on database server',
    'Restart database service if necessary (with backup plan)',
    'Monitor query latency post-recovery'
  ],
  'Authentication': [
    'Verify OAuth/API token service is responding',
    'Check session store (Redis/memcached) availability',
    'Review recent deployments to auth service',
    'Clear stale sessions if applicable',
    'Test login flow end-to-end with test account'
  ],
  'Payment Gateway': [
    'Check payment provider status page',
    'Verify API keys and webhook configurations',
    'Review recent changes to billing service',
    'Test payment flow with test card',
    'Monitor transaction success rate post-recovery'
  ],
  'Payment': [
    'Check payment provider status page',
    'Verify API keys and webhook configurations',
    'Review recent changes to billing service',
    'Test payment flow with test card',
    'Monitor transaction success rate post-recovery'
  ],
  'Frontend': [
    'Check CDN cache status and purge if necessary',
    'Verify frontend deployment is correct',
    'Clear browser cache and test incognito mode',
    'Check JavaScript console for errors',
    'Monitor page load metrics post-recovery'
  ]
};

function generateRunbook(incident) {
  /**
   * Takes a structured incident and generates a contextual runbook
   */
  const { affectedComponent, errorCategory } = incident.classification;
  
  // Find matching template
  let steps = runbookTemplates[affectedComponent] || runbookTemplates['Frontend'];
  
  // If the triage agent already provided steps, prefer those
  if (incident.remediationRunbook.suggestedSteps && incident.remediationRunbook.suggestedSteps.length > 0) {
    steps = incident.remediationRunbook.suggestedSteps;
  }
  
  return {
    ...incident,
    remediationRunbook: {
      ...incident.remediationRunbook,
      suggestedSteps: steps
    }
  };
}

export default { generateRunbook };
