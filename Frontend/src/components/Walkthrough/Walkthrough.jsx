import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalkthrough } from '../../context/WalkthroughContext';
import { useToast } from '../common/Toast';
import { MaterialSymbol } from '../common/MaterialSymbol';
import { ingestAlert } from '../../lib/api';
import { simulateIncident } from '../../lib/simulate-incident';
import styles from './Walkthrough.module.css';

/**
 * Walkthrough steps.
 *
 * Step types:
 * - 'info'     – centered card with text, no target
 * - 'target'   – floating card pointing to a target element
 * - 'navigate' – user clicks "Next" to auto-navigate to a route
 * - 'action'   – user must click a specific element to proceed; shows a pulse on the target
 * - 'code'     – centered card with a copy-pasteable code snippet
 * - 'incubate' – waiting step (incident processing); shows a progress indicator
 */
const STEPS = [
  // ── 1. Welcome ──
  {
    id: 'welcome',
    type: 'info',
    title: 'Welcome to SecureOps Sync',
    description:
      'This is your incident response command center. Let\'s walk through the key parts — it only takes a minute.',
    icon: 'rocket_launch',
  },

  // ── 2. Sidebar ──
  {
    id: 'sidebar',
    type: 'target',
    title: 'Navigate Your Workspace',
    description:
      'The sidebar connects every section: Dashboard, Incidents, Analytics, Runbooks, and Settings. Each view manages a different phase of the incident lifecycle.',
    icon: 'menu',
    targetSelector: '[class*="sidebar"]',
    tooltipPlacement: 'right',
  },

  // ── 3. Dashboard Live View ──
  {
    id: 'dashboard',
    type: 'target',
    title: 'Live Incident Dashboard',
    description:
      'Your main command center. P0/P1 counts show the most urgent incidents at a glance. The featured card highlights the most critical ongoing issue, and the list below updates in real time via WebSocket.',
    icon: 'dashboard',
    targetSelector: '[class*="statCard"]',
    tooltipPlacement: 'bottom',
  },

  // ── 4. Trigger a sample incident ──
  {
    id: 'ingest-command',
    type: 'code',
    title: 'Trigger a Sample Incident',
    description:
      'Click the button below to inject a real P0 incident into the AI pipeline. It simulates a DB connection pool exhaustion scenario.',
    icon: 'bolt',
    buttonLabel: 'Inject Incident →',
  },

  // ── 5. Processing ──
  {
    id: 'processing',
    type: 'incubate',
    title: 'Incident Processing',
    description:
      'The AI pipeline is analyzing the incident — classifying severity, identifying root cause, and generating a runbook.',
    icon: 'autorenew',
    duration: 1500,
  },

  // ── 6. Auto: Navigating to Dashboard ──
  {
    id: 'nav-dashboard',
    type: 'auto',
    title: 'Viewing Dashboard',
    description:
      'Your incident has been created and triaged. Taking you to the Dashboard to see it in the live view.',
    icon: 'dashboard',
    route: '/',
    autoAdvanceDelay: 800,
  },

  // ── 7. Auto: See incident on Dashboard ──
  {
    id: 'see-incident',
    type: 'auto',
    title: 'Your Incident is Live',
    description:
      'Look for your new P0_CRITICAL incident in the featured card or incident list. Notice the severity badge, AI headline, and confidence score.',
    icon: 'visibility',
    autoAdvanceDelay: 3000,
  },

  // ── 8. Auto: Navigate to Incidents ──
  {
    id: 'nav-incidents',
    type: 'auto',
    title: 'Incidents Overview',
    description:
      'The Incidents page lists every alert with AI triage — severity, component, headline, and confidence. Full detail view with AI Copilot is a click away.',
    icon: 'security',
    route: '/incidents',
    autoAdvanceDelay: 800,
  },

  // ── 9. Complete ──
  {
    id: 'complete',
    type: 'auto',
    title: 'You\'re All Set',
    description:
      'You\'ve seen the core workflow: create an incident → AI triage → view results. Replay this tour anytime from Settings. Happy incident responding!',
    icon: 'check_circle',
    autoAdvanceDelay: 3000,
  },
];

export const Walkthrough = () => {
  const {
    isOpen,
    dismissWalkthrough,
    completeWalkthrough,
  } = useWalkthrough();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [stepIndex, setStepIndex] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [incubating, setIncubating] = useState(false);
  const [actionCompleted, setActionCompleted] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const tooltipRef = useRef(null);

  // ── Animate in ──
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      resetStepState();
    }
  }, [isOpen]);

  function resetStepState() {
    setStepIndex(0);
    setIncubating(false);
    setActionCompleted(false);
    setTriggering(false);
    setTooltipStyle({});
  }

  // ── Position tooltip near target elements ──
  const positionTooltip = useCallback(() => {
    const step = STEPS[stepIndex];
    if (!step || (step.type !== 'target' && step.type !== 'action') || !step.targetSelector) {
      setTooltipStyle({});
      return;
    }

    const target = document.querySelector(step.targetSelector);
    if (!target) {
      setTooltipStyle({});
      return;
    }

    const rect = target.getBoundingClientRect();
    const placement = step.tooltipPlacement || 'right';
    const gap = 18;
    const tooltipWidth = 320;

    let top, left;

    switch (placement) {
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + gap;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - gap - tooltipWidth;
        break;
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'top':
        top = rect.top - gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      default:
        top = rect.top + rect.height / 2;
        left = rect.right + gap;
    }

    // Clamp to viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const estimatedHeight = 220;

    left = Math.max(gap, Math.min(left, vw - tooltipWidth - gap));
    top = Math.max(gap, Math.min(top, vh - estimatedHeight - gap));

    setTooltipStyle({ top, left });
  }, [stepIndex]);

  useEffect(() => {
    if (!visible) return;
    positionTooltip();
    window.addEventListener('resize', positionTooltip);
    return () => window.removeEventListener('resize', positionTooltip);
  }, [visible, positionTooltip, stepIndex]);

  // ── Auto-advance effect ──
  // Runs when step changes: handles incubate, auto, and navigate steps
  const autoAdvanceRef = useRef(null);
  useEffect(() => {
    const step = STEPS[stepIndex];
    if (!step || !visible) return;

    // Clear any pending auto-advance
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }

    if (step.type === 'incubate') {
      setIncubating(true);
      autoAdvanceRef.current = setTimeout(() => {
        setIncubating(false);
        advance();
      }, step.duration || 2000);
    }

    if (step.type === 'auto') {
      // Navigate if route is specified
      if (step.route) {
        navigate(step.route);
      }
      autoAdvanceRef.current = setTimeout(() => {
        advance();
      }, step.autoAdvanceDelay || 2000);
    }

    return () => {
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
        autoAdvanceRef.current = null;
      }
    };
  }, [stepIndex, visible, navigate]);

  function advance() {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      handleComplete();
    }
  }

  // ── Trigger incident handler ──
  const handleTrigger = useCallback(async () => {
    setTriggering(true);
    try {
      await ingestAlert({
        source: 'chaos-panel',
        title: 'DB Connection Pool Exhausted',
        service: 'Payments API',
        severity: 'P0',
        symptoms: ['High latency on checkout', '500 errors spiking', 'Postgres connections maxed'],
      });
      addToast(
        '✅ P0 incident injected — AI pipeline processing.',
        'success',
        5000
      );
    } catch {
      // Backend unavailable — fall back to local simulation
      simulateIncident({
        title: 'DB Connection Pool Exhausted',
        service: 'Payments API',
        severity: 'P0',
        symptoms: ['High latency on checkout', '500 errors spiking', 'Postgres connections maxed'],
      });
      addToast(
        '⚡ Demo incident created (offline mode) — navigating to Dashboard.',
        'success',
        5000
      );
    } finally {
      setTriggering(false);
      // Advance to incubate step
      setStepIndex((i) => i + 1);
    }
  }, [addToast]);

  // ── Next / Prev ──
  const handleNext = useCallback(() => {
    const step = STEPS[stepIndex];

    // For action steps, don't allow Next until action is done
    if (step.type === 'action' && !actionCompleted) {
      return;
    }

    // For incubate/auto step, advance() handles it via effect
    if (step.type === 'incubate' || step.type === 'auto') {
      return;
    }

    // For code steps (trigger type), handleNext is disabled — user must click the trigger button
    if (step.type === 'code' && !triggering) {
      return;
    }

    // For navigate steps, trigger the navigation
    if (step.type === 'navigate') {
      if (step.route) {
        navigate(step.route);
        setTimeout(() => {
          if (stepIndex < STEPS.length - 1) {
            setStepIndex((i) => i + 1);
          } else {
            handleComplete();
          }
        }, 400);
        return;
      }
    }

    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      handleComplete();
    }
  }, [stepIndex, actionCompleted, navigate]);

  const handlePrev = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
    }
  }, [stepIndex]);

  // ── Reset action state on step changes ──
  useEffect(() => {
    setActionCompleted(false);
  }, [stepIndex]);

  const handleComplete = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setExiting(false);
      completeWalkthrough();
      resetStepState();
    }, 300);
  }, [completeWalkthrough]);

  const handleSkip = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setExiting(false);
      dismissWalkthrough();
      resetStepState();
    }, 300);
  }, [dismissWalkthrough]);

  const handleKeyDown = useCallback(
    (e) => {
      if (!visible) return;
      if (e.key === 'Escape') handleSkip();
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    },
    [visible, handleNext, handlePrev, handleSkip],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen && !exiting) return null;

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;
  const isCentered = step.type === 'info' || step.type === 'incubate' || step.type === 'auto' || step.type === 'code';
  const isActionStep = step.type === 'action';
  const isNavigateStep = step.type === 'navigate';
  const isCodeStep = step.type === 'code';
  const isIncubateStep = step.type === 'incubate';
  const isAutoStep = step.type === 'auto';
  const needsTarget = step.type === 'target' || step.type === 'action';
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  return (
    <div
      className={`${styles.overlay} ${visible ? styles.overlayVisible : ''} ${exiting ? styles.overlayExiting : ''} ${isActionStep && !actionCompleted ? styles.overlayClickThrough : ''}`}
    >
      {/* Highlight ring for target/action steps */}
      {needsTarget && step.targetSelector && (
        <HighlightRing
          selector={step.targetSelector}
          visible={visible}
          pulse={isActionStep && !actionCompleted}
        />
      )}

      {/* Connector arrow for floating tooltips */}
      {!isCentered && step.targetSelector && !isActionStep && (
        <ConnectorArrow
          selector={step.targetSelector}
          placement={step.tooltipPlacement || 'right'}
          tooltipStyle={tooltipStyle}
        />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className={`${styles.tooltip} ${isCentered ? styles.tooltipCenter : styles.tooltipFloating} ${visible ? styles.tooltipVisible : ''} ${isActionStep && !actionCompleted ? styles.tooltipAction : ''}`}
        style={isCentered ? {} : tooltipStyle}
      >
        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        {/* Icon (spinning for incubate) */}
        <div className={`${styles.iconWrap} ${isIncubateStep ? styles.iconSpin : ''}`}>
          <MaterialSymbol icon={step.icon} className={styles.stepIcon} />
        </div>

        {/* Content */}
        <h3 className={styles.title}>{step.title}</h3>
        <p className={styles.desc}>{step.description}</p>

        {/* Trigger button for code steps */}
        {isCodeStep && (
          <div className={styles.triggerSection}>
            <button
              className={styles.triggerBtn}
              onClick={handleTrigger}
              disabled={triggering}
            >
              {triggering ? (
                <>
                  <MaterialSymbol icon="autorenew" className={styles.iconSpin} />
                  Injecting…
                </>
              ) : (
                <>
                  <MaterialSymbol icon="bolt" />
                  {step.buttonLabel || 'Inject Incident →'}
                </>
              )}
            </button>
          </div>
        )}

        {/* Action hint for action steps */}
        {isActionStep && !actionCompleted && (
          <div className={styles.actionHint}>
            <span className={styles.actionPulse} />
            {step.actionHint || 'Click the highlighted element above'}
          </div>
        )}

        {/* Action completed feedback */}
        {isActionStep && actionCompleted && (
          <div className={styles.actionDone}>
            <MaterialSymbol icon="check_circle" /> Done!
          </div>
        )}

        {/* Incubate spinner */}
        {isIncubateStep && (
          <div className={styles.incubateBar}>
            <div className={styles.incubateTrack}>
              <div className={styles.incubateFill} />
            </div>
            <span className={styles.incubateLabel}>Processing incident…</span>
          </div>
        )}

        {/* Auto-advance countdown */}
        {isAutoStep && (
          <div className={styles.autoProgress}>
            <div className={styles.autoTrack}>
              <div
                className={styles.autoFill}
                style={{ animationDuration: `${(step.autoAdvanceDelay || 2000) / 1000}s` }}
              />
            </div>
          </div>
        )}

        {/* Step indicator */}
        <div className={styles.dots}>
          {STEPS.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === stepIndex ? styles.dotActive : ''}`}
              onClick={() => setStepIndex(i)}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.skipBtn} onClick={handleSkip}>
            Skip tour
          </button>
          <div className={styles.navButtons}>
            {!isFirst && (
              <button className={styles.navBtn} onClick={handlePrev}>
                <MaterialSymbol icon="arrow_back" />
              </button>
            )}

            {/* Navigate step button — calls handleNext which handles navigation */}
            {isNavigateStep && (
              <button className={styles.nextBtn} onClick={handleNext}>
                <MaterialSymbol icon="open_in_new" />
                {step.actionLabel || 'Go'}
              </button>
            )}

            {/* Action step: show "Skip" if not done, or advance */}
            {isActionStep && actionCompleted && (
              <button className={styles.nextBtn} onClick={handleNext}>
                Next <MaterialSymbol icon="arrow_forward" />
              </button>
            )}

            {/* Incubate step */}
            {isIncubateStep && (
              <button className={styles.nextBtn} disabled>
                <MaterialSymbol icon="autorenew" className={styles.iconSpin} />
                Processing…
              </button>
            )}

            {/* Auto step — no button needed, auto-advances */}
            {isAutoStep && (
              <button className={styles.nextBtn} disabled>
                <MaterialSymbol icon="arrow_forward" />
                Next
              </button>
            )}

            {/* Code step — no navigation buttons, trigger button handles everything */}
            {isCodeStep && (
              <button className={styles.nextBtn} disabled={!triggering}>
                {triggering ? 'Processing…' : 'Waiting…'}
              </button>
            )}

            {/* Info/target step standard Next/Done */}
            {!isNavigateStep && !isActionStep && !isIncubateStep && !isAutoStep && !isCodeStep && (
              <button className={styles.nextBtn} onClick={handleNext}>
                {isLast ? 'Done' : 'Next'}
                {!isLast && <MaterialSymbol icon="arrow_forward" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Highlight Ring ──
function HighlightRing({ selector, visible, pulse = false }) {
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (!visible || !selector) return;

    const updatePosition = () => {
      const el = document.querySelector(selector);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setStyle({
        top: rect.top - 6,
        left: rect.left - 6,
        width: rect.width + 12,
        height: rect.height + 12,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [selector, visible]);

  if (!style.width) return null;

  return (
    <div
      className={`${styles.highlightRing} ${visible ? styles.highlightVisible : ''} ${pulse ? styles.highlightPulse : ''}`}
      style={style}
    />
  );
}

// ── Connector Arrow ──
function ConnectorArrow({ selector, placement, tooltipStyle }) {
  const [arrowStyle, setArrowStyle] = useState({});

  useEffect(() => {
    if (!selector || !tooltipStyle.top) return;

    const el = document.querySelector(selector);
    if (!el) return;
    const rect = el.getBoundingClientRect();

    const tooltipTop = tooltipStyle.top || 0;
    const tooltipLeft = tooltipStyle.left || 0;
    const tooltipW = 320;

    let top, left, rotation;

    switch (placement) {
      case 'right': {
        top = rect.top + rect.height / 2 - 4;
        left = rect.right + 4;
        rotation = 0;
        break;
      }
      case 'left': {
        top = rect.top + rect.height / 2 - 4;
        left = rect.left - 16;
        rotation = 180;
        break;
      }
      case 'bottom': {
        top = rect.bottom + 4;
        left = rect.left + rect.width / 2 - 8;
        rotation = 90;
        break;
      }
      case 'top': {
        top = rect.top - 16;
        left = rect.left + rect.width / 2 - 8;
        rotation = -90;
        break;
      }
      default: {
        top = rect.top + rect.height / 2 - 4;
        left = rect.right + 4;
        rotation = 0;
      }
    }

    setArrowStyle({ top, left, transform: `rotate(${rotation}deg)` });
  }, [selector, placement, tooltipStyle]);

  if (!arrowStyle.top) return null;

  return (
    <div className={styles.connectorArrow} style={arrowStyle}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M0 7L14 0L14 14L0 7Z" fill="rgba(120, 140, 255, 0.35)" />
      </svg>
    </div>
  );
}
