import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalkthrough } from '../../context/WalkthroughContext';
import { useToast } from '../common/Toast';
import { MaterialSymbol } from '../common/MaterialSymbol';
import { ingestAlert } from '../../lib/api';
import { simulateIncident } from '../../lib/simulate-incident';
import styles from './Walkthrough.module.css';

/**
 * Polished product tour steps.
 *
 * Step types:
 * - 'info'     – centered card with text, no target
 * - 'target'   – floating card pointing to a target element on the page
 * - 'navigate' – auto-navigates to a route
 * - 'action'   – user must interact with a highlighted element
 * - 'code'     – centered card with a trigger button
 * - 'incubate' – waiting step with animated progress
 * - 'auto'     – auto-advancing step with countdown
 */
const STEPS = [
  {
    id: 'welcome',
    type: 'info',
    title: 'Welcome to SecureOps Sync',
    description:
      'Your incident response command center. You\'re signed in and ready. This quick tour will walk you through the key areas — it only takes a minute.',
    icon: 'rocket_launch',
  },
  {
    id: 'sidebar',
    type: 'target',
    title: 'Sidebar — Your Command Hub',
    description:
      'Everything lives in the sidebar: Dashboard, Incidents, Analytics, Submit, and Settings. Toggle dark/light mode, check your connection status, and sign out — all from here.',
    icon: 'menu',
    targetSelector: '[class*="sidebar"]',
    tooltipPlacement: 'right',
  },
  {
    id: 'dashboard',
    type: 'target',
    title: 'Live Incident Dashboard',
    description:
      'Your command center. P0/P1 counts show the most urgent incidents at a glance. The featured card highlights the critical issue, and the live list updates in real time via WebSocket.',
    icon: 'dashboard',
    targetSelector: '[class*="statCard"]',
    tooltipPlacement: 'bottom',
  },
  {
    id: 'ingest-command',
    type: 'code',
    title: 'Try It — Inject a Sample Incident',
    description:
      'Click the button below to inject a real P0 incident into the AI pipeline. It simulates a DB connection pool exhaustion on the Payments API — watch it get triaged in real time.',
    icon: 'bolt',
    buttonLabel: '🔥 Inject P0 Incident',
  },
  {
    id: 'processing',
    type: 'incubate',
    title: 'AI Pipeline Processing',
    description:
      'The triage engine is analyzing the incident — classifying severity, identifying root cause, and preparing remediation steps. This only takes a moment.',
    icon: 'autorenew',
    duration: 1500,
  },
  {
    id: 'nav-dashboard',
    type: 'auto',
    title: 'Your Incident on the Dashboard',
    description:
      'Head to the Dashboard to see your new P0_CRITICAL incident live in the feed with its AI-generated headline, severity badge, and confidence score.',
    icon: 'dashboard',
    route: '/',
    autoAdvanceDelay: 800,
  },
  {
    id: 'see-incident',
    type: 'auto',
    title: 'It\'s Live',
    description:
      'Look for the featured card — it shows the most critical incident. Notice the severity badge, AI analysis headline, and confidence score. Click any incident to dive deeper.',
    icon: 'visibility',
    autoAdvanceDelay: 3000,
  },
  {
    id: 'nav-incidents',
    type: 'auto',
    title: 'Incidents Page',
    description:
      'The Incidents page lists every alert with AI triage data — severity, component, headline, and confidence. Sort, filter, and click through to the full incident view with AI Copilot.',
    icon: 'security',
    route: '/incidents',
    autoAdvanceDelay: 800,
  },
  {
    id: 'complete',
    type: 'auto',
    title: 'You\'re All Set!',
    description:
      'You\'ve seen the full workflow: inject an incident → AI triage → view results. Replay this tour anytime from Settings. Happy incident responding!',
    icon: 'check_circle',
    autoAdvanceDelay: 3000,
  },
];

export const Walkthrough = () => {
  const { isOpen, dismissWalkthrough, completeWalkthrough } = useWalkthrough();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [stepIndex, setStepIndex] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [incubating, setIncubating] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [entering, setEntering] = useState(false);
  const tooltipRef = useRef(null);
  const arrowIdRef = useRef(`arrowGrad_${Math.random().toString(36).slice(2, 8)}`);

  // ── Animate in ──
  useEffect(() => {
    if (isOpen) {
      setExiting(false);
      const t = setTimeout(() => {
        setVisible(true);
        setEntering(true);
      }, 50);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      setEntering(false);
      resetStepState();
    }
  }, [isOpen]);

  // ── Step entrance animation ──
  useEffect(() => {
    if (visible) {
      // Reset entrance, then trigger it
      setEntering(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setEntering(true);
        });
      });
    }
  }, [stepIndex, visible]);

  function resetStepState() {
    setStepIndex(0);
    setIncubating(false);
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
    const tooltipWidth = 340;

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
    const estimatedHeight = 240;
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

  // ── Auto-advance effect for incubate/auto steps ──
  const autoAdvanceRef = useRef(null);
  useEffect(() => {
    const step = STEPS[stepIndex];
    if (!step || !visible) return;

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
      if (step.route) navigate(step.route);
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

  // ── Advance / Prev ──
  function advance() {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      handleComplete();
    }
  }

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
      addToast('P0 incident injected — AI pipeline processing.', 'success', 5000);
    } catch {
      simulateIncident({
        title: 'DB Connection Pool Exhausted',
        service: 'Payments API',
        severity: 'P0',
        symptoms: ['High latency on checkout', '500 errors spiking', 'Postgres connections maxed'],
      });
      addToast('Demo incident created (offline mode).', 'success', 5000);
    } finally {
      setTriggering(false);
      setStepIndex((i) => i + 1);
    }
  }, [addToast]);

  const handleNext = useCallback(() => {
    const step = STEPS[stepIndex];
    if (step.type === 'incubate' || step.type === 'auto') return;
    if (step.type === 'code' && !triggering) return;
    advance();
  }, [stepIndex, triggering]);

  const handlePrev = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
    }
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
  const isCentered = ['info', 'incubate', 'auto', 'code'].includes(step.type);
  const isCodeStep = step.type === 'code';
  const isIncubateStep = step.type === 'incubate';
  const isAutoStep = step.type === 'auto';
  const needsTarget = step.type === 'target' || step.type === 'action';
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  return (
    <div
      className={[
        styles.overlay,
        visible ? styles.overlayVisible : '',
        exiting ? styles.overlayExiting : '',
      ].join(' ')}
    >
      {/* Spotlight highlight for target steps */}
      {needsTarget && step.targetSelector && (
        <SpotlightHighlight
          selector={step.targetSelector}
          visible={visible && entering}
        />
      )}

      {/* Connector arrow for floating tooltips */}
      {!isCentered && step.targetSelector && (
        <ConnectorArrow
          key={`arrow-${stepIndex}`}
          selector={step.targetSelector}
          placement={step.tooltipPlacement || 'right'}
          tooltipStyle={tooltipStyle}
          gradientId={arrowIdRef.current}
        />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className={[
          styles.tooltip,
          isCentered ? styles.tooltipCenter : styles.tooltipFloating,
          visible && entering ? styles.tooltipEnter : '',
          visible ? styles.tooltipVisible : '',
        ].join(' ')}
        style={isCentered ? {} : tooltipStyle}
      >
        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        {/* Step counter */}
        <div className={styles.stepCounter}>
          Step {stepIndex + 1} of {STEPS.length}
        </div>

        {/* Icon */}
        <div className={`${styles.iconWrap} ${isIncubateStep ? styles.iconSpin : ''}`}>
          <MaterialSymbol icon={step.icon} className={styles.stepIcon} />
        </div>

        {/* Title & description */}
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
                  {step.buttonLabel || 'Inject Incident'}
                </>
              )}
            </button>
          </div>
        )}

        {/* Incubate progress animation */}
        {isIncubateStep && (
          <div className={styles.incubateSection}>
            <div className={styles.incubateTrack}>
              <div className={styles.incubateFill} />
            </div>
            <span className={styles.incubateLabel}>Analyzing incident…</span>
          </div>
        )}

        {/* Auto-advance countdown */}
        {isAutoStep && (
          <div className={styles.autoSection}>
            <div className={styles.autoTrack}>
              <div
                className={styles.autoFill}
                style={{ animationDuration: `${(step.autoAdvanceDelay || 2000) / 1000}s` }}
              />
            </div>
          </div>
        )}

        {/* Navigation dots */}
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

        {/* Footer actions */}
        <div className={styles.actions}>
          <button className={styles.skipBtn} onClick={handleSkip}>
            <MaterialSymbol icon="close" /> Skip
          </button>

          <div className={styles.navButtons}>
            {!isFirst && (
              <button className={styles.navBtn} onClick={handlePrev} title="Previous (←)">
                <MaterialSymbol icon="arrow_back" />
              </button>
            )}

            {/* Info/target standard step */}
            {['info', 'target', 'navigate'].includes(step.type) && (
              <button className={styles.nextBtn} onClick={handleNext}>
                {isLast ? 'Done' : 'Next'}
                {!isLast && <MaterialSymbol icon="arrow_forward" />}
              </button>
            )}

            {/* Code step — trigger handles everything */}
            {isCodeStep && (
              <button className={styles.nextBtn} disabled={!triggering}>
                {triggering ? (
                  <><MaterialSymbol icon="autorenew" className={styles.iconSpin} /> Processing</>
                ) : 'Waiting…'}
              </button>
            )}

            {/* Incubate step — disabled during processing */}
            {isIncubateStep && (
              <button className={styles.nextBtn} disabled>
                <MaterialSymbol icon="autorenew" className={styles.iconSpin} /> Processing
              </button>
            )}

            {/* Auto step */}
            {isAutoStep && (
              <button className={styles.nextBtn} disabled>
                <MaterialSymbol icon="arrow_forward" /> Next
              </button>
            )}
          </div>
        </div>

        {/* Keyboard hint */}
        <div className={styles.kbdHint}>
          <span>Use <kbd>→</kbd> <kbd>←</kbd> to navigate · <kbd>Esc</kbd> to skip</span>
        </div>
      </div>
    </div>
  );
};

// ── Spotlight Highlight ──
function SpotlightHighlight({ selector, visible }) {
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (!visible || !selector) return;

    const update = () => {
      const el = document.querySelector(selector);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setStyle({
        top: rect.top - 8,
        left: rect.left - 8,
        width: rect.width + 16,
        height: rect.height + 16,
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [selector, visible]);

  if (!style.width) return null;

  return (
    <>
      {/* Outer glow ring */}
      <div
        className={`${styles.spotlightRing} ${visible ? styles.spotlightVisible : ''}`}
        style={style}
      />
      {/* Inner highlight border */}
      <div
        className={`${styles.spotlightBorder} ${visible ? styles.spotlightVisible : ''}`}
        style={style}
      />
    </>
  );
}

// ── Connector Arrow ──
function ConnectorArrow({ selector, placement, tooltipStyle, gradientId = 'arrowGrad' }) {
  const [arrowStyle, setArrowStyle] = useState({});

  useEffect(() => {
    if (!selector || !tooltipStyle.top) return;

    const el = document.querySelector(selector);
    if (!el) return;
    const rect = el.getBoundingClientRect();

    let top, left, rotation;

    switch (placement) {
      case 'right':
        top = rect.top + rect.height / 2 - 6;
        left = rect.right + 4;
        rotation = 0;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - 6;
        left = rect.left - 18;
        rotation = 180;
        break;
      case 'bottom':
        top = rect.bottom + 4;
        left = rect.left + rect.width / 2 - 8;
        rotation = 90;
        break;
      case 'top':
        top = rect.top - 18;
        left = rect.left + rect.width / 2 - 8;
        rotation = -90;
        break;
      default:
        top = rect.top + rect.height / 2 - 6;
        left = rect.right + 4;
        rotation = 0;
    }

    setArrowStyle({ top, left, transform: `rotate(${rotation}deg)` });
  }, [selector, placement, tooltipStyle]);

  if (!arrowStyle.top) return null;

  return (
    <div className={styles.connectorArrow} style={arrowStyle}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M0 8L16 1L16 15L0 8Z" fill={`url(#${gradientId})`} />
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="16" y2="8">
            <stop offset="0%" stopColor="#788cff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.9" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
