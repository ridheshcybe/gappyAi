import incidentStore from "./stores/datastore.js";

const severities = ["P0_CRITICAL", "P1_HIGH", "P2_MEDIUM", "P3_LOW"];
const components = ["API Gateway", "Authentication Service", "Database", "Frontend", "Payment Processing", "User Management"];
const errorCategories = ["Timeout", "ValidationError", "DatabaseConnectionError", "Unauthorized", "NotFound", "InternalError"];
const headlines = [
  "High latency detected in API gateway",
  "Failed authentication attempts spike",
  "Database connection pool exhausted",
  "Frontend deployment failed",
  "Payment processing errors increasing",
  "Unable to fetch user profile",
  "SSL certificate expiration warning",
  "Memory leak detected in service",
  "Disk usage exceeding threshold",
  "Invalid request payload received"
];
const rootCauses = [
  "Increased traffic without autoscaling",
  "Brute force attack on login endpoint",
  "Misconfigured database connection limits",
  "Failed npm build process",
  "Third-party payment gateway downtime",
  "User service dependency failure",
  "Certificate not renewed before expiry",
  "Memory not released in loop",
  "Log rotation not configured",
  "Missing required field in API request"
];
const impacts = [
  "Users experiencing slow response times",
  "Potential account compromise risk",
  "Application unable to read/write critical data",
  "Users unable to access new features",
  "Failed transactions affecting revenue",
  "Users unable to update profile information",
  "Security risk due to expired certificate",
  "Application performance degradation over time",
  "Risk of data loss due to insufficient storage",
  "API requests failing validation"
];

function generateIncident() {
  const severity = severities[Math.floor(Math.random() * severities.length)];
  const component = components[Math.floor(Math.random() * components.length)];
  const errorCategory = errorCategories[Math.floor(Math.random() * errorCategories.length)];
  const headline = headlines[Math.floor(Math.random() * headlines.length)];
  const rootCause = rootCauses[Math.floor(Math.random() * rootCauses.length)];
  const impact = impacts[Math.floor(Math.random() * impacts.length)];

  const incidentId = `incident-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const timestamp = new Date().toISOString();

  const timeline = [
    { event: "Alert Received", timestamp: timestamp },
    { event: "AI Triage Complete", timestamp: new Date().toISOString() },
    { event: "Stored", timestamp: new Date().toISOString() },
    { event: "Routed", timestamp: new Date().toISOString() }
  ];

  const confidenceScore = Math.floor(Math.random() * 100) + 1;

  return {
    incidentId,
    timestamp,
    classification: {
      severity,
      affectedComponent: component,
      errorCategory
    },
    triageAnalysis: {
      headline,
      rootCauseInferred: rootCause,
      userImpactDescription: impact
    },
    remediationRunbook: {
      status: "Open",
      suggestedSteps: [
        "Investigate root cause",
        "Apply temporary workaround",
        "Implement permanent fix",
        "Monitor for recurrence"
      ],
      draftedNotification: `Incident detected: ${headline}. Please investigate immediately.`
    },
    timeline,
    confidenceScore
  };
}

async function seed() {
  console.log("Seeding database with 20 test incidents...");

  for (let i = 0; i < 20; i++) {
    const incident = generateIncident();
    await incidentStore.save(incident.incidentId, incident);
    console.log(`Seeded incident ${incident.incidentId}`);
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);