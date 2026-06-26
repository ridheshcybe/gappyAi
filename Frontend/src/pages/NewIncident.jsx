import { useState, useEffect, useRef } from "react";
import { ingestAlert, triageAlert } from "../lib/api";
import { socket } from "../lib/socket";

const STAGES = [
  { key: "triage", label: "AI Triage" },
  { key: "root-cause", label: "Root Cause" },
  { key: "runbook", label: "Runbook" },
  { key: "validate", label: "Validation" },
  { key: "store", label: "Storing" },
  { key: "history", label: "History" },
  { key: "route", label: "Routing" },
  { key: "finalize", label: "Finalizing" },
];

export default function NewIncident() {
  const [payload, setPayload] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [currentStage, setCurrentStage] = useState(null);
  const [progressMessage, setProgressMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const currentAlertId = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const handleProgress = (data) => {
      if (mountedRef.current && data.alertId === currentAlertId.current) {
        setProgress(data.progress);
        setCurrentStage(data.stage);
        setProgressMessage(data.message);
      }
    };
    socket.on("triage:progress", handleProgress);
    return () => {
      mountedRef.current = false;
      socket.off("triage:progress", handleProgress);
    };
  }, []);

  const getStageIndex = (stageKey) =>
    STAGES.findIndex((s) => s.key === stageKey);

  async function submit() {
    if (!payload.trim()) {
      setError("Please enter alert data.");
      return;
    }
    setLoading(true);
    setError("");
    setProgress(0);
    setCurrentStage(null);
    setProgressMessage("Ingesting alert…");
    setSuccess(false);

    try {
      const result = await ingestAlert({ source: "webhook", payload });
      if (!mountedRef.current) return;
      currentAlertId.current = result.alertId;
      await triageAlert(result.alertId);
      if (!mountedRef.current) return;
      setSuccess(true);
      setProgress(100);
      setCurrentStage("finalize");
      setProgressMessage("Triage complete!");
      setTimeout(() => {
        if (mountedRef.current) {
          setSuccess(false);
          setLoading(false);
          setProgress(null);
          setCurrentStage(null);
          setProgressMessage("");
          setPayload("");
        }
      }, 3000);
    } catch {
      if (!mountedRef.current) return;
      setError("Processing failed");
      setLoading(false);
      setProgress(null);
      setCurrentStage(null);
      setProgressMessage("");
      currentAlertId.current = null;
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Submit Incident</h1>

      <textarea
        className="w-full h-64 mt-4 bg-neutral-900 rounded-xl p-4 disabled:opacity-50"
        value={payload}
        onChange={(e) => setPayload(e.target.value)}
        disabled={loading}
        placeholder="Paste alert data here…"
      />

      {error && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={loading}
        className="mt-4 bg-blue-500 px-6 py-3 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {success
          ? "\u2713 Triaged"
          : loading
            ? "Processing..."
            : "Run AI Triage"}
      </button>

      {loading && progress !== null && (
        <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-400 mb-3">{progressMessage}</p>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map((stage, idx) => {
              const stageIdx = getStageIndex(currentStage);
              const isActive = stage.key === currentStage;
              const isDone =
                stageIdx > idx ||
                (stage.key === "finalize" && progress === 100);
              return (
                <span
                  key={stage.key}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    isDone
                      ? "bg-green-900/30 text-green-400 border border-green-500/30"
                      : isActive
                        ? "bg-blue-900/30 text-blue-300 border border-blue-500/40 shadow-lg shadow-blue-500/20"
                        : "bg-white/5 text-white/30 border border-white/10"
                  }`}
                >
                  {isDone ? "\u2713" : isActive ? "\u23F3" : "\u25CB"}
                  {stage.label}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
