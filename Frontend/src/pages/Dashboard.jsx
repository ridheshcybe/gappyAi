// frontend/pages/Dashboard.jsx
import {
  useEffect,
  useState,
} from "react";

import {
  getIncidents,
} from "../lib/api";

import IncidentCard from "../components/IncidentCard";
import ExecutiveDashboard from "../components/ExecutiveDashboard";
import ActivityFeed from "../components/ActivityFeed";
import SystemTopology from "../components/SystemTopology";
import { socket } from "../lib/socket";

export default function Dashboard() {
  const [
    incidents,
    setIncidents,
  ] = useState([]);

  async function load() {
    const data =
      await getIncidents();

    setIncidents(
      data.incidents || []
    );
  }

  useEffect(() => {
    load();

    const interval =
      setInterval(
        load,
        5000
      );

    // WebSocket listener for live updates
    socket.on(
      "incident_created",
      (incident) => {
        setIncidents((prev) => [incident, ...prev]);
      }
    );

    return () => {
      clearInterval(
        interval
      );
      socket.off("incident_created");
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">
        SecureOps Sync
      </h1>

      {/* Executive Dashboard */}
      <ExecutiveDashboard className="mb-6" />

      {/* System Topology */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">System Topology</h2>
        <SystemTopology />
      </div>

      {/* Recent Incidents */}
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        {incidents.map(
          (incident) => (
            <IncidentCard
              key={
                incident.incidentId
              }
              incident={
                incident
              }
            />
          )
        )}
      </div>

      {/* Global Activity Feed */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">Global Activity Feed</h2>
        <ActivityFeed />
      </div>
    </div>
  );
}