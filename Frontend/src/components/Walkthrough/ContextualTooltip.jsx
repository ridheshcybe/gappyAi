import React, { useState, useRef, useEffect } from 'react';
import styles from './ContextualTooltip.module.css';

/**
 * ContextualTooltip – a small "i" badge that reveals an explanation on hover.
 *
 * Usage:
 *   <ContextualTooltip title="Stats Card" placement="top">
 *     Shows the count of active P0 (critical) incidents that require immediate attention.
 *   </ContextualTooltip>
 */
export const ContextualTooltip = ({
  children,
  title = '',
  placement = 'top',
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const [posStyle, setPosStyle] = useState({});

  useEffect(() => {
    if (!open || !triggerRef.current || !tooltipRef.current) return;

    const trigger = triggerRef.current.getBoundingClientRect();
    const tooltipW = tooltipRef.current.offsetWidth;
    const tooltipH = tooltipRef.current.offsetHeight;
    const gap = 8;

    let top, left;

    switch (placement) {
      case 'top':
        top = trigger.top - tooltipH - gap;
        left = trigger.left + trigger.width / 2 - tooltipW / 2;
        break;
      case 'bottom':
        top = trigger.bottom + gap;
        left = trigger.left + trigger.width / 2 - tooltipW / 2;
        break;
      case 'left':
        top = trigger.top + trigger.height / 2 - tooltipH / 2;
        left = trigger.left - tooltipW - gap;
        break;
      case 'right':
        top = trigger.top + trigger.height / 2 - tooltipH / 2;
        left = trigger.right + gap;
        break;
      default:
        top = trigger.bottom + gap;
        left = trigger.left + trigger.width / 2 - tooltipW / 2;
    }

    // Clamp to viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 8;
    left = Math.max(pad, Math.min(left, vw - tooltipW - pad));
    top = Math.max(pad, Math.min(top, vh - tooltipH - pad));

    setPosStyle({ top, left });
  }, [open, placement]);

  return (
    <span
      className={`${styles.wrapper} ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      ref={triggerRef}
      tabIndex={0}
      role="button"
      aria-label={title || 'Learn more'}
    >
      <span className={styles.badge} aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5.5" stroke="currentColor" />
          <text x="6" y="8.5" textAnchor="middle" fontSize="9" fill="currentColor" fontWeight="600">
            i
          </text>
        </svg>
      </span>

      {/* Tooltip portal */}
      {open && (
        <div
          className={`${styles.tooltipPortal} ${styles[`placement${placement.charAt(0).toUpperCase() + placement.slice(1)}`]}`}
          style={posStyle}
          ref={tooltipRef}
        >
          {title && <div className={styles.tooltipTitle}>{title}</div>}
          <div className={styles.tooltipBody}>{children}</div>
        </div>
      )}
    </span>
  );
};
