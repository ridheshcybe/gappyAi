// frontend/components/IncidentDetails.jsx
import IncidentCopilot from './IncidentCopilot';
import ActivityFeed from './ActivityFeed';

export default function IncidentDetails({
  incident,
}) {
  if (!incident)
    return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-neutral-950 p-6 overflow-y-auto">
      <h2 className="font-bold text-xl">
        {
          incident
            .triageAnalysis
            .headline
        }
      </h2>

      {/* Incident Copilot */}
      <IncidentCopilot incidentId={incident.incidentId || incident.id} />

      {/* Activity Feed */}
      <ActivityFeed incidentId={incident.incidentId || incident.id} />

      <p className="mt-4">
        Root Cause:
      </p>

      <p className="opacity-80">
        {
          incident
            .triageAnalysis
            .rootCauseInferred
        }
      </p>

      {incident.timeline && incident.timeline.length > 0 ? (
        <div className="mt-6">
          <h3 className="font-bold text-lg">Timeline</h3>
          <div className="mt-3 space-y-2">
            {incident.timeline.map((event, idx) => (
              <div key={idx} className="flex justify-between text-sm opacity-80">
                <span>{event.event}</span>
                <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )
      ) : null}

      <h3 className="mt-6 font-bold">
        Runbook
      </h3>

      <ul className="mt-3">
        {incident
          .remediationRunbook
          .suggestedSteps.map(
            (
              step,
              idx
            ) => (
              <li
                key={idx}
              >
                • {step}
              </li>
            )
          )}
      </ul>
    </div>
  );
}