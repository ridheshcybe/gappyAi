// backend/lemma-config.js
import { LemmaClient } from "lemma-sdk";

// Initialize the Lemma Client pointing to your pod
export const lemmaClient = new LemmaClient({
  apiUrl: process.env.LEMMA_API_URL || 'http://localhost:8080',
  authUrl: process.env.LEMMA_AUTH_URL || 'http://localhost:8080/auth',
  podId: process.env.LEMMA_POD_ID || 'default-pod',
  apiKey: process.env.LEMMA_API_KEY || '',
});

// Track initialization state
let _initialized = false;

// Export an async initializer to call when your server starts
export async function initLemma() {
  if (_initialized) return lemmaClient;
  
  try {
    await lemmaClient.initialize();
    _initialized = true;
    console.log(`✅ Lemma Client initialized for Pod: ${process.env.LEMMA_POD_ID}`);
    return lemmaClient;
  } catch (err) {
    console.error("❌ Lemma Client failed to initialize:", err.message);
    console.warn("⚠️  Running in degraded mode - some features may not work");
    _initialized = true;
    return lemmaClient;
  }
}

export default lemmaClient;