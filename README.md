# SecureOps Sync — AI Incident Triage & Remediation

A lightweight, secure operations dashboard powered by Lemma SDK. Analyzes messy, unstructured incident reports and auto-generates structured triages, runbooks, and team notifications.

## The Problem

Small development teams and freelancers handle critical, time-sensitive incidents scattered across emails, Slack, Discord, and logs. Valuable minutes are wasted parsing chaos, finding who's available, and mapping the response protocol. **SecureOps Sync automates the first 80% of incident response.**

## The Solution

An AI-powered triage agent that:
1. **Ingests** raw alerts from any source (email, logs, chat)
2. **Analyzes** incident context, severity, and root cause
3. **Generates** step-by-step runbooks for on-call engineers
4. **Routes** high-severity incidents to the right channels
5. **Tracks** incident state and resolution in a dashboard

## Built With

- **Frontend:** React (clean, minimal dashboard)
- **Backend:** Node.js + Express (API for ingestion, triage, storage)
- **AI Agent:** Lemma SDK + OpenAI GPT-4 (structured triage logic)
- **Storage:** Lemma Document Store (raw alerts) + Lemma Datastore (structured incidents)
- **Deployment:** Deploy-ready with Docker/Vercel/Railway

## Architecture

```
[ Raw Alert Input ] (Email/Slack/Log/Webhook)
         ↓
[ Lemma Document Store ] (Raw text storage)
         ↓
[ AI Triage Agent ] (Extract severity, component, impact, steps)
         ↓
[ JSON Schema Validation ] (Ensure structured format)
         ↓
[ Lemma Datastore ] (Store structured incident)
         ↓
[ Alert Router ] (Route by severity: P0→urgent, P1→team, P2/P3→log)
         ↓
[ Dashboard + API ] (Display, query, manage incidents)
```

## Data Flow

### Input Schema (Raw Alert)
```json
{
  "source": "email|discord|slack|log|webhook",
  "payload": "raw unstructured text"
}
```

### Output Schema (Structured Incident)
```json
{
  "incidentId": "INC-1234",
  "timestamp": "2026-06-24T12:34:56Z",
  "classification": {
    "severity": "P0_CRITICAL|P1_HIGH|P2_MEDIUM|P3_LOW",
    "affectedComponent": "Database|Payment Gateway|Auth Service|...",
    "errorCategory": "Timeout|Auth Failure|Service Down|..."
  },
  "triageAnalysis": {
    "headline": "One-line summary of the issue",
    "rootCauseInferred": "Technical analysis of root cause",
    "userImpactDescription": "What end-users experience"
  },
  "remediationRunbook": {
    "status": "PENDING_TRIAGE|RUNBOOK_GENERATED|RESOLVED",
    "suggestedSteps": ["Step 1", "Step 2", "..."],
    "draftedNotification": "Public or internal status update"
  }
}
```

## How to Run

### Prerequisites
- Node.js v18+
- OpenAI API key (or Anthropic/OpenRouter)
- Lemma SDK (launched June 24)

### Setup

1. **Clone and install:**
   ```bash
   git clone https://github.com/yourusername/secureoops-sync.git
   cd secureoops-sync
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Start backend:**
   ```bash
   node backend/index.js
   # Backend runs on http://localhost:3000
   ```

4. **Start frontend (in another terminal):**
   ```bash
   cd frontend
   npm install
   npm start
   # Frontend runs on http://localhost:3000 (will use port 3001 if 3000 is taken)
   ```

5. **Open dashboard:**
   Navigate to http://localhost:3000 (or :3001)

## API Endpoints

### POST /api/ingest
Ingest a raw alert.

**Request:**
```json
{
  "source": "email",
  "payload": "URGENT: Payment gateway down..."
}
```

**Response:**
```json
{
  "success": true,
  "alertId": "alert_1234567890_abc123"
}
```

### POST /api/triage/:alertId
Trigger AI triage for an alert.

**Response:**
```json
{
  "success": true,
  "incident": { /* StructuredIncident object */ }
}
```

### GET /api/incidents
Fetch all incidents.

**Response:**
```json
{
  "success": true,
  "incidents": [ /* Array of StructuredIncident objects */ ]
}
```

### GET /api/incidents/:incidentId
Fetch a single incident.

## Demo

See `demo.mp4` for a live walkthrough:
1. Raw messy error log pasted into dashboard
2. AI processes it in real-time
3. Structured incident appears with severity, runbook, notification

## Judging Criteria Mapping

| Criterion | How SecureOps Sync Addresses It |
|-----------|----------------------------------|
| **Problem Clarity (35%)** | Solves a real pain point for small ops teams: unstructured incident chaos. Clear user (on-call engineer) and workflow (triage → remediation). |
| **Product Judgment (25%)** | Minimal, focused scope: triage + runbooks, not everything. End-to-end demo works. Severity routing shows product thinking. |
| **Execution Quality (25%)** | Clean architecture, error handling, validated outputs, responsive dashboard. Code is readable and ship-ready. |
| **Lemma SDK Utilization (15%)** | Uses Document Store (input), AI Agent (triage), Datastore (output), Workflows (routing). Full end-to-end stack. |

## What's Next

- [ ] Slack/Discord webhook integration (real-time alerts)
- [ ] PagerDuty/Opsgenie routing for P0 incidents
- [ ] Runbook template library (per service/team)
- [ ] Historical incident analytics & trends
- [ ] Multi-team support with role-based access
- [ ] Custom severity rules per team

## Team & Credits

**Ridhesh** — Built the full stack (frontend, backend, AI integration)

## License

MIT

---

**Ready to ship.** June 30, 2026.
