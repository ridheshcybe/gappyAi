import { AlertTriangle } from "lucide-react";

export default function IncidentCard({
  incident,
}) {
  const severity =
    incident.classification
      .severity;

  const severityColor = {
    P0_CRITICAL:
      "border-red-500",
    P1_HIGH:
      "border-orange-500",
    P2_MEDIUM:
      "border-yellow-500",
    P3_LOW:
      "border-green-500",
  };

  return (
    <div
      className={`border-l-4 ${severityColor[severity]} bg-neutral-900 rounded-xl p-4`}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle />

        <h3 className="font-bold">
          {
            incident
              .triageAnalysis
              .headline
          }
        </h3>
      </div>

      <p className="text-sm opacity-70 mt-2">
        {
          incident
            .classification
            .affectedComponent
        }
      </p>

      <p className="text-xs mt-3">
        Severity:
        <span className="font-bold ml-2">
          {severity}
        </span>
      </p>

      <p className="text-xs mt-1">
        Confidence:
        <span className="font-bold ml-2">
          {incident.confidenceScore === undefined ?
            'N/A' :
            `${incident.confidenceScore}%`
          }
        </span>
      </p>
    </div>
  );
}