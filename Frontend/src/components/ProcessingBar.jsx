import React, { useState, useEffect, useRef, useCallback } from 'react';
import { socket } from '../lib/socket';
import styles from './ProcessingBar.module.css';

const FUNNY_MESSAGES = [
  'Convincing the AI it\'s not a feature request...',
  'Counting packets on the wire...',
  'Consulting the digital oracle...',
  'Reticulating splines...',
  'Waking up the on-call engineer...',
  'Asking Stack Overflow... (just kidding)',
  'Performing percussive maintenance...',
  'Brewing coffee for the AI...',
  'Checking if it\'s DNS...',
  'Reading the runbook backwards...',
  'Flux capacitor at 88%...',
  'Teaching the AI memes about pager duty...',
  'Checking the phase of the moon...',
  'Degaussing the network...',
  'Finding the person who said "it works on my machine"...',
  'Running git blame on production...',
  'Turning it off and on again...',
  'Sending good vibes to the server rack...',
  'Recalibrating the rubber duck...',
  'Asking the senior dev who\'s on leave...',
];

function ProcessingBar() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const visibleRef = useRef(false);
  const funnyInterval = useRef(null);
  const hideTimeout = useRef(null);

  // Cycle through funny messages
  const startFunnyCycle = useCallback(() => {
    if (funnyInterval.current) clearInterval(funnyInterval.current);
    setMessageIndex(Math.floor(Math.random() * FUNNY_MESSAGES.length));
    funnyInterval.current = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % FUNNY_MESSAGES.length);
    }, 4000);
  }, []);

  const stopFunnyCycle = useCallback(() => {
    if (funnyInterval.current) {
      clearInterval(funnyInterval.current);
      funnyInterval.current = null;
    }
  }, []);

  useEffect(() => {
    const handleProgress = (data) => {
      // Clear any pending hide timeout
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
        hideTimeout.current = null;
      }

      setProgress(data.progress);

      if (!visibleRef.current) {
        visibleRef.current = true;
        setVisible(true);
        startFunnyCycle();
      }

      // If triage is complete (100%), schedule hiding with a small delay
      if (data.progress >= 100 || data.stage === 'finalize') {
        stopFunnyCycle();
        hideTimeout.current = setTimeout(() => {
          setVisible(false);
          visibleRef.current = false;
          setProgress(0);
        }, 2000);
      }
    };

    socket.on('triage:progress', handleProgress);

    return () => {
      socket.off('triage:progress', handleProgress);
      stopFunnyCycle();
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, [startFunnyCycle, stopFunnyCycle]);

  // Sync ref with state so it stays accurate between renders
  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  return (
    <div className={`${styles.bar} ${!visible ? styles.barHidden : ''}`}>
      <div className={styles.inner}>
        <span>⚙️ Processing</span>
        <span className={styles.dots}>
          <span />
          <span />
          <span />
        </span>
        <span className={styles.progressPct}>{progress}%</span>
        <span className={styles.funnyMessage} key={messageIndex}>
          {FUNNY_MESSAGES[messageIndex]}
        </span>
      </div>
    </div>
  );
}

export default ProcessingBar;
