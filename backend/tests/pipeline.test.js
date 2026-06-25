import { ingestAlert } from "../input-handler.js";
import { triageIncident } from "../triage-pipeline.js";

(async () => {
  try {
    console.log(
      "\n🧪 SECUREOPS TEST\n"
    );

    const alertId =
      await ingestAlert({
        source: "email",

        payload:
          "CRITICAL: Database connection pool exhausted. No successful requests in 5 minutes.",
      });

    console.log(
      "✓ Alert Ingested"
    );

    const result =
      await triageIncident(
        alertId
      );

    console.log(
      "\n✓ Pipeline Complete"
    );

    console.log(
      result.incident
        .classification
        .severity
    );

    console.log(
      result.routingResult
    );
  } catch (err) {
    console.error(err);
  }
})();