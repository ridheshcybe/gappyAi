import React, { useRef, useCallback, useEffect, useState } from 'react';

/**
 * TiltCard — wraps children with a 3D perspective tilt effect on hover.
 * The card gently rotates following the cursor position, creating a tactile
 * premium feel. Disabled on touch devices and when prefers-reduced-motion is set.
 */
export default function TiltCard({ children, className = '', maxTilt = 6, style = {}, ...rest }) {
  const cardRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  }, [maxTilt]);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  }, []);

  return (
    <div
      ref={cardRef}
      className={className}
      style={{
        ...style,
        transition: 'transform 0.15s cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: reducedMotion ? 'auto' : 'transform',
      }}
      onMouseMove={reducedMotion ? undefined : handleMouseMove}
      onMouseLeave={reducedMotion ? undefined : handleMouseLeave}
      {...rest}
    >
      {children}
    </div>
  );
}
