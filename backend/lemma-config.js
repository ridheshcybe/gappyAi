// backend/lemma-config.js
import { LemmaClient } from "lemma-sdk";

// Initialize the Lemma Client pointing to your pod
export const lemmaClient = new LemmaClient({
  apiUrl: process.env.LEMMA_API_URL,
  authUrl: process.env.LEMMA_AUTH_URL,
  podId: process.env.LEMMA_POD_ID,
});

// Export an async initializer to call when your server starts
export async function initLemma() {
  try {
    await lemmaClient.initialize();
    console.log(`✅ Lemma Client initialized for Pod: ${process.env.LEMMA_POD_ID}`);
  } catch (err) {
    console.error("❌ Lemma Client failed to initialize:", err.message);
  }
}

export default lemmaClient;