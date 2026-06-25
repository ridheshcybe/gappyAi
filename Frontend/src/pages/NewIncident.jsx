import {
  useState,
} from "react";

import {
  ingestAlert,
  triageAlert,
} from "../lib/api";

export default function NewIncident() {
  const [
    payload,
    setPayload,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  async function submit() {
    setLoading(true);

    try {
      const ingest =
        await ingestAlert({
          source: "webhook",
          payload,
        });

      await triageAlert(
        ingest.alertId
      );

      alert(
        "Incident processed"
      );

      setPayload("");
    } catch {
      alert(
        "Processing failed"
      );
    }

    setLoading(false);
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold">
        Submit Incident
      </h1>

      <textarea
        className="w-full h-64 mt-4 bg-neutral-900 rounded-xl p-4"
        value={payload}
        onChange={(e) =>
          setPayload(
            e.target.value
          )
        }
      />

      <button
        onClick={submit}
        disabled={loading}
        className="mt-4 bg-blue-500 px-6 py-3 rounded-xl"
      >
        {loading
          ? "Processing..."
          : "Run AI Triage"}
      </button>
    </div>
  );
}
</parameter=/