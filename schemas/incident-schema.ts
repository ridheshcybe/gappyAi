// Raw incoming alert shape
export interface RawAlert {
  id: string;
  source: 'email' | 'discord' | 'slack' | 'webhook' | 'log';
  rawPayload: string;
  receivedAt: string;
}

// Structured incident after AI triage
export interface StructuredIncident {
  incidentId: string;
  timestamp: string;
  
  classification: {
    severity: 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MEDIUM' | 'P3_LOW';
    affectedComponent: string;
    errorCategory: string;
  };

  triageAnalysis: {
    headline: string;
    rootCauseInferred: string;
    userImpactDescription: string;
  };

  remediationRunbook: {
    status: 'PENDING_TRIAGE' | 'RUNBOOK_GENERATED' | 'RESOLVED';
    suggestedSteps: string[];
    draftedNotification: string;
  };
}
