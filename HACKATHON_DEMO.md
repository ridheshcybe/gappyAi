# SecureOps Sync Hackathon Demo Script
## 4-Minute Presentation Guide

### Overview
This script guides a 4-minute live demo of SecureOps Sync showcasing all implemented features from the 6-day development sprint.

### Timing Breakdown
- **0:00-0:30** - Introduction & Problem Statement (30 seconds)
- **0:30-1:30** - Core Triage Pipeline Demo (60 seconds)
- **1:30-2:15** - Historical Memory & Similarity Search (45 seconds)
- **2:15-3:00** - Incident Copilot Chat & Activity Feed (45 seconds)
- **3:00-3:30** - Auto Escalation & Team Assignment (30 seconds)
- **3:30-4:00** - AI Post-Mortem + Executive Dashboard + Topology Map (30 seconds)

---

## Detailed Script

### 0:00-0:30 - Introduction & Problem Statement
> "Hi everyone, I'm Ridhesh, and I'll demonstrate SecureOps Sync - an AI-powered incident triage platform built in just 6 days using Lemma SDK.
> 
> **The Problem**: Development teams waste precious minutes parsing chaotic incident reports from emails, Slack, and logs. Critical seconds are lost figuring out what's broken, who to notify, and how to fix it.
> 
> **Our Solution**: SecureOps Sync automates the first 80% of incident response - from raw alert ingestion to structured triage, runbook generation, notification routing, and real-time dashboard visibility."

*(Show the dashboard homepage)*

### 0:30-1:30 - Core Triage Pipeline Demo
> "Let me show you our core multi-agent pipeline in action:"
> 
> 1. **Ingest Raw Alert** *(Click "New Incident" button)*
>    - Paste a messy alert: "URGENT: Customers can't checkout! Payment gateway timing out since 2PM EST. Error: GATEWAY_TIMEOUT"
>    - Click "Submit"
> 
> 2. **Watch AI Processing** *(Explain what's happening behind the scenes)*
>    - "Our system now processes this through 4 specialized AI agents:"
>    - **Triage Agent**: Classifies severity as P1_HIGH, affected component as Payment Gateway
>    - **Root Cause Agent**: *"Analyzing infrastructure dependencies... Likely cause: Database connection pool exhaustion under peak load"*
>    - **Runbook Agent**: *"Generating step-by-step recovery procedure..."*
>    - **Notification Agent**: *"Creating Slack/email/PagerDuty alerts..."*
> 
> 3. **Show Results** *(Wait for processing to complete)*
>    - Display the structured incident with:
>      - Severity badge: P1_HIGH
>      - Headline: "Payment Gateway Timeout During Peak Load"
>      - Root Cause: "Database connection pool exhaustion under peak load"
>      - User Impact: "Customers unable to complete purchases"
>      - Runbook Steps: Show numbered list
>      - Drafted Notification: Show Slack message template
> 
> *"All this happens automatically in under 10 seconds - what would take an engineer 15+ minutes to figure out."*

### 1:30-2:15 - Historical Memory & Similarity Search
> "Now let's see how our system learns from past incidents:"
> 
> 1. **Create a Similar Incident**
>    - Click "New Incident" again
>    - Paste: "Users reporting payment failures. Gateway shows timeout errors."
>    - Submit
> 
> 2. **Show Historical Similarities**
>    - Once processed, click on the incident to open details
>    - Point to the "Similar Past Incidents" section
>    - Show how it found our previous payment gateway incident (similarity >0.75)
>    - Display the similarity score and shared characteristics
> 
> 3. **Explain the Technology**
>    - "Under the hood: We're using text-embedding-3-small to create vector embeddings"
>    - "Cosine similarity search with 0.75 threshold find semantically similar incidents"
>    - "This gives engineers instant access to past solutions and runbooks"
> 
> *"No more reinventing the wheel - our system surfaces relevant historical context automatically."*

### 2:15-3:00 - Incident Copilot Chat & Activity Feed
> "Next, our AI Copilot for interactive incident investigation:"
> 
> 1. **Open Copilot Chat**
>    - In the incident details view, click the "Chat with Copilot" tab
>    - Show suggested questions: "What dependencies should I check?" or "How long did similar incidents take to resolve?"
> 
> 2. **Demonstrate Conversational AI**
>    - Ask: "What are the database connection limits for our payment service?"
>    - Wait for response showing context-aware answer
>    - Ask: "Should we scale up the connection pool or optimize queries first?"
>    - Show how Copilot maintains conversation history
> 
> 3. **Show Live Activity Feed**
>    - Point to the global activity feed on the dashboard
>    - Explain how every action (ingest, triage, runbook generation) creates activity entries
>    - Mention WebSocket integration for real-time updates
>    - "Teams can follow incident progress live as it unfolds"
> 
> *"Like having a senior SRE available 24/7 to answer questions and guide investigation."*

### 3:00-3:30 - Auto Escalation & Team Assignment
> "Our system doesn't just analyze - it takes action:"
> 
> 1. **Show Auto Escalation**
>    - Explain how P1 incidents automatically escalate after 15 minutes if unresolved
>    - Show escalation service configuration (business hours aware, severity-based)
> 
> 2. **Demonstrate Smart Assignment**
>    - Click "Recommend Assignee" button on incident
>    - Show how it analyzes:
>      - Engineer expertise (payment gateway specialists)
>      - Historical resolution success rates
>      - Current workload and on-call schedules
>    - Display recommended assignee with confidence score
> 
> 3. **Show Manual Assignment**
>    - Demonstrate assigning to specific engineer with reason
>    - Explain how this assignment gets logged in activity feed
> 
> *"Automatic escalation ensures nothing falls through cracks, while smart assignment gets the right person on the job fast."*

### 3:30-4:00 - AI Post-Mortem + Executive Dashboard + Topology Map
> "Finally, let's look at our post-incident analytics and system visibility:"
> 
> 1. **AI Generated Post-Mortem**
>    - Resolve the incident (click "Resolve Incident")
>    - Click "Generate Post-Mortem" button
>    - Show the structured markdown with:
>      - Timeline of events
>      - Root cause analysis
>      - Impact assessment
>      - Action items and prevention steps
>    - "Saves engineers hours of documentation work"
> 
> 2. **Executive Dashboard**
>    - Navigate to dashboard view
>    - Show executive metrics panel:
>      - Open Incidents: [X]
>      - MTTR: [X] minutes (trending ↓)
>      - Reliability Score: [X]% (trending →)
>      - Revenue Impact: $[X]K (trending ↓)
>    - Explain 7-day trend charts
> 
> 3. **System Topology Map**
>    - Show the topology visualization
>    - Point out how affected services pulse red during incidents
>    - Explain the static topology definition (CDN → Gateway → Services → Databases/Cache)
>    - "Instant blast radius visualization during incidents"
> 
> *"From post-incident learning to executive visibility to real-time system mapping - we close the full incident lifecycle."*

### Closing (if time allows)
> "In just 6 days, we've built a complete AI incident response platform that:"
> - ✅ Reduces MTTR by automating triage and runbook generation
> - ✅ Prevents repeated mistakes with historical similarity search
> - ✅ Provides 24/7 expert guidance via AI Copilot
> - ✅ Ensures proper escalation and assignment
> - ✅ Delivers executive visibility and system awareness
> - ✅ All powered by Lemma SDK's Document Store, AI Agents, and Datastore
> 
> "Thank you! Questions?"

## Technical Notes for Demo
- Ensure backend is running on `http://localhost:3000`
- Ensure frontend is running on `http://localhost:3000` (or :3001)
- Have sample incident data ready to paste
- Consider pre-populating with one incident to show historical search immediately
- Test WebSocket connections for live activity updates
- Verify all AI agents are responding correctly