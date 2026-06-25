export default function StatsBar({
  incidents,
}) {
  const p0 =
    incidents.filter(
      (i) =>
        i.classification
          .severity ===
        "P0_CRITICAL"
    ).length;

  const p1 =
    incidents.filter(
      (i) =>
        i.classification
          .severity ===
        "P1_HIGH"
    ).length;

  // Calculate average confidence score
  const avgConfidence =
    incidents.length > 0
      ? Math.round(
          incidents.reduce((sum, incident) => {
            return sum + (incident.confidenceScore || 0);
          }, 0) / incidents.length
        )
      : 0;

  // Calculate mean time to triage (from Alert Received to AI Triage Complete)
  const triageTimes = incidents
    .map((incident) => {
      const alertReceived = incident.timeline.find(
        (event) => event.event === "Alert Received"
      );
      const aiTriageComplete = incident.timeline.find(
        (event) => event.event === "AI Triage Complete"
      );

      if (alertReceived && aiTriageComplete) {
        const received = new Date(alertReceived.timestamp).getTime();
        const completed = new Date(aiTriageComplete.timestamp).getTime();
        return (completed - received) / (1000 * 60); // Convert to minutes
      }
      return null;
    })
    .filter((time) => time !== null);

  const avgTriageTime =
    triageTimes.length > 0
      ? Math.round(
          triageTimes.reduce((sum, time) => sum + time, 0) / triageTimes.length
        )
      : 0;

  // For now, consider all incidents as "open" since we don't have resolution tracking
  const openIncidents = incidents.length;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-neutral-900 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Total Incidents</h3>
            <p className="text-xs opacity-60">All tracked incidents</p>
          </div>
          <h2 className="text-2xl font-bold">{incidents.length}</h2>
        </div>
      </div>

      <div className="bg-red-950 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Critical (P0)</h3>
            <p className="text-xs opacity-60">Requires immediate attention</p>
          </div>
          <div>
            <h3 className="font-semibold">Critical (P0)</h3>
            <p className="text-xs opacity-60">Highest severity</p>
          </div>
          <h2 className="text-2xl font-bold">{p0}</h2>
        </div>
      </div>

      <div className="bg-orange-950 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">High (P1)</h3>
            <p className="text-xs opacity-60">Urgent attention needed</p>
          </div>
          <h2 className="text-2xl font-bold">{p1}</h2>
        </div>
      </div>

      <div className="bg-neutral-900 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Avg Confidence</h3>
            <p className="text-xs opacity-60">AI assessment quality</p>
          </div>
          <h2 className="text-2xl font-bold">{avgConfidence}%</h2>
        </div>
      </div>

      <div className="bg-blue-950 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Open Incidents</h3>
            <p className="text-xs opacity-60">Currently active</p>
          </div>
          <h2 className="text-2xl font-bold">{openIncidents}</h2>
        </div>
      </div>

      <div className="bg-green-950 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Avg Triage Time</h3>
            <p className="text-xs opacity-60">Minutes to assess</p>
          </div>
          <h2 className="text-2xl font-bold">{avgTriageTime}</h2>
        </div>
      </div>
    </div>
  );
}