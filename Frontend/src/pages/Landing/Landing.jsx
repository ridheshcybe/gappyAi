import React from 'react';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/common/Button';
import { MaterialSymbol } from '../../components/common/MaterialSymbol';
import styles from './Landing.module.css';

const Landing = () => {
  return (
    <div className={styles.landing}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1>Triage incidents in seconds. Not minutes.</h1>
          <p>
            Messy alerts → structured incidents → actionable runbooks. Your team
            stops fighting chaos and starts fixing problems.
          </p>
          <div className={styles.cta}>
            <Button variant="primary" className={styles.primaryBtn}>
              Try Live Demo
            </Button>
            <span>No signup required. See it work in 90 seconds.</span>
          </div>
        </div>
        <div className={styles.preview}>
          <div className={styles.previewPlaceholder}>
            Dashboard Preview (Replace with actual screenshot)
          </div>
        </div>
      </section>

      <section className={styles.problem}>
        <div className={styles.problemGrid}>
          <div>
            <h2>The Cost of Chaos</h2>
            <div className={styles.statsList}>
              <div className={styles.statItem}>
                <span>$500/min</span>
                <span>Average cost of downtime</span>
              </div>
              <div className={styles.statItem}>
                <span>15-20 min</span>
                <span>Wasted on manual triage</span>
              </div>
              <div className={styles.statItem}>
                <span>3 Channels</span>
                <span>Fragmented communication</span>
              </div>
            </div>
          </div>
          <div>
            <h3>Why this happens</h3>
            <ul className={styles.reasons}>
              <li><MaterialSymbol icon="close" /> Alert fatigue leads to missed critical incidents and team burnout.</li>
              <li><MaterialSymbol icon="close" /> Manual triage delays Mean Time To Resolution (MTTR) significantly.</li>
              <li><MaterialSymbol icon="close" /> Siloed communication during high-severity events causes mass confusion.</li>
              <li><MaterialSymbol icon="close" /> Lack of structured post-mortems prevents systemic improvements over time.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.workflow}>
        <h2>The Orchestrated Flow</h2>
        <div className={styles.workflowGrid}>
          <div className={styles.workflowStep}>
            <div className={styles.stepIcon}><MaterialSymbol icon="input" /></div>
            <h3>Ingest</h3>
            <p>Aggregate signals from all monitoring tools instantly into a single source of truth.</p>
          </div>
          <div className={styles.workflowStep}>
            <div className={styles.stepIcon}><MaterialSymbol icon="analytics" /></div>
            <h3>Analyze</h3>
            <p>AI-driven noise reduction and intelligent severity classification to cut through the noise.</p>
          </div>
          <div className={styles.workflowStep}>
            <div className={styles.stepIcon}><MaterialSymbol icon="build" /></div>
            <h3>Action</h3>
            <p>Execute automated runbooks and coordinate response efforts to resolve quickly.</p>
          </div>
        </div>
      </section>

      <section className={styles.dashboardPreview}>
        <h2>Total Visibility, Zero Clutter</h2>
        <div className={styles.previewPlaceholder}>Dashboard Preview</div>
      </section>

      <section className={styles.whyWorks}>
        <h2>Why Teams Trust Us</h2>
        <div className={styles.reasonsList}>
          <div className={styles.reasonItem}>
            <span className={styles.reasonNumber}>1</span>
            <div>
              <h3>Eliminates Noise</h3>
              <p>
                By grouping related alerts into single, manageable incidents, we
                reduce alert fatigue and help your team focus on the actual problem,
                not the symptoms.
              </p>
            </div>
          </div>
          <div className={styles.reasonItem}>
            <span className={styles.reasonNumber}>2</span>
            <div>
              <h3>Automates the Routine</h3>
              <p>
                Attach executable runbooks directly to incidents based on service and
                severity. Stop digging through wikis when seconds count.
              </p>
            </div>
          </div>
          <div className={styles.reasonItem}>
            <span className={styles.reasonNumber}>3</span>
            <div>
              <h3>Synchronizes the Team</h3>
              <p>
                Real-time incident state sync ensures everyone is looking at the
                same data, no matter where they are working from.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.built}>
        <div className={styles.builtGrid}>
          <div>
            <h2>Engineered for Scale</h2>
            <p>
              SecureOps Sync is built on a modern, robust stack designed to handle
              thousands of events per second without breaking a sweat.
            </p>
            <div className={styles.techTags}>
              <span>React</span>
              <span>Node.js</span>
              <span>Lemma SDK</span>
              <span>GPT-4</span>
              <span>PostgreSQL</span>
              <span>Redis</span>
            </div>
          </div>
          <div className={styles.capabilities}>
            <h3>Core Capabilities</h3>
            <ul>
              <li><MaterialSymbol icon="check_circle" /> Sub-second event ingestion latency</li>
              <li><MaterialSymbol icon="check_circle" /> Enterprise-grade RBAC &amp; Audit Logs</li>
              <li><MaterialSymbol icon="check_circle" /> SOC2 Type II Compliant Infrastructure</li>
              <li><MaterialSymbol icon="check_circle" /> 99.99% Financially Backed SLA</li>
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.finalCta}>
        <h2>Ready to end the chaos?</h2>
        <p>Join engineering teams who have reduced their MTTR by over 40% in the first month.</p>
        <div className={styles.ctaButtons}>
          <Button variant="primary" className={styles.primaryBtn}>
            Try Live Demo
          </Button>
          <Button variant="secondary" className={styles.secondaryBtn}>
            View on GitHub
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;