import dotenv from "dotenv";
dotenv.config();

import { Lemma } from "lemma-sdk";

const lemma = new Lemma({
  apiKey: process.env.LEMMA_API_KEY || "",
  environment: process.env.LEMMA_ENVIRONMENT || "local",
  dataDir: process.env.LEMMA_DATA_DIR || "./data",
  verbose: true,
});

export default lemma;