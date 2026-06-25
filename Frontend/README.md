# SecureOps Sync

AI-powered incident triage & remediation for small ops teams.

## Overview

SecureOps Sync is an intelligent incident management system that automates triage, routing, and notification of operational incidents using AI-powered analysis.

## Features

- 🤖 AI-powered incident triage and analysis
- 🔄 Real-time WebSocket updates for live dashboard
- 📤 Slack integration for critical incident notifications
- 📊 Comprehensive analytics and statistics
- ⚡ Configurable alert routing based on severity
- 🐳 Docker and Railway deployment ready
- 📱 Responsive frontend dashboard

## Architecture

### Backend (Node.js/Express)
- **Document Store**: Raw alert persistence (Lemma SDK)
- **Data Store**: Structured incident storage (Lemma SDK)
- **Triage Agent**: AI-powered incident analysis (Lemma SDK)
- **Workflow Engine**: Alert routing and escalation (Lemma SDK)
- **WebSocket Server**: Real-time communication
- **Integrations**: Slack notifications

### Frontend (React/Vite)
- **Dashboard**: Real-time incident overview
- **Incident Cards**: Visual incident representation
- **Incident Details**: Deep-dive incident view with timeline
- **Stats Bar**: Key metrics and analytics

## Environment Variables

Create a `.env` file in the root directory with the following variables:

### Required Variables
```
# OpenAI API Key (for AI triage)
OPENAI_API_KEY=your_openai_api_key_here

# Lemma SDK Configuration
LEMMA_API_KEY=your_lemma_api_key_here
LEMMA_ENVIRONMENT=local
LEMMA_DATA_DIR=./data

# Slack Integration (for critical incident notifications)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Frontend Configuration (Vite)
VITE_API_URL=http://localhost:3000  # Backend API URL
```

### Optional Variables
```
# Node.js Environment
NODE_ENV=development

# Port Configuration
PORT=3000  # Backend port
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd frontend && npm install
   ```
3. Create a `.env` file with the required environment variables
4. Seed the database with sample data (optional):
   ```bash
   node backend/seed.js
   ```

## Development

### Start Backend
```bash
npm start
```

### Start Frontend
```bash
cd frontend
npm run dev
```

## Deployment

### Docker
```bash
docker-compose up --build
```

### Railway
1. Push to GitHub repository connected to Railway
2. Set environment variables in Railway dashboard
3. Railway will automatically build and deploy

## API Endpoints

### POST `/api/ingest`
Ingest a new alert for processing
```json
{
  "source": "monitoring-tool",
  "payload": {
    "message": "High latency detected",
    "metric": "response_time",
    "value": 5000
  },
  "receivedAt": "2026-06-24T10:00:00Z"
}
```

### GET `/api/incidents`
Retrieve all incidents

### GET `/api/incidents/:id`
Retrieve a specific incident by ID

## Data Model

### Incident Structure
```json
{
  "incidentId": "string",
  "timestamp": "date-time",
  "classification": {
    "severity": "P0_CRITICAL|P1_HIGH|P2_MEDIUM|P3_LOW",
    "affectedComponent": "string",
    "errorCategory": "string"
  },
  "triageAnalysis": {
    "headline": "string",
    "rootCauseInferred": "string",
    "userImpactDescription": "string"
  },
  "remediationRunbook": {
    "status": "string",
    "suggestedSteps": ["string"],
    "draftedNotification": "string"
  },
  "timeline": [
    {
      "event": "string",
      "timestamp": "date-time"
    }
  ],
  "confidenceScore": "integer (0-100)"
}
```

## Timeline Events
- `Alert Received`: When the alert was first received
- `AI Triage Complete`: When AI analysis finished
- `Stored`: When incident was saved to datastore
- `Routed`: When incident was routed to appropriate team/channel

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

ISC