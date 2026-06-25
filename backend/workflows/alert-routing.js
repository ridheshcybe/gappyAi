import lemma from "../lemma-config.js";
import { notify } from "../integrations/slack.js";

const alertRoutingWorkflow = lemma.workflow(
  "alert_routing",
  {
    description:
      "Route incidents based on severity",

    steps: [
      {
        name: "route",
        type: "function",

        handler: async (incident) => {
          const severity =
            incident.classification.severity;

          switch (severity) {
            case "P0_CRITICAL":
              console.log(
                "🚨 Routing to Critical Channel"
              );
              await notify(incident);

              return {
                route: "critical",
                status: "ROUTED",
              };

            case "P1_HIGH":
              console.log(
                "⚠️ Routing to Engineering Team"
              );

              return {
                route: "team",
                status: "ROUTED",
              };

            case "P2_MEDIUM":
              console.log(
                "📋 Dashboard Notification"
              );

              return {
                route: "dashboard",
                status: "ROUTED",
              };

            default:
              console.log(
                "ℹ️ Archive Incident"
              );

              return {
                route: "archive",
                status: "ROUTED",
              };
          }
        },
      },
    ],
  }
);

export default alertRoutingWorkflow;