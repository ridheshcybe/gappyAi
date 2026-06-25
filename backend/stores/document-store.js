import lemma from "../lemma-config.js";

const rawAlertStore = lemma.documentStore("raw_alerts", {
  description: "Raw incoming alerts",
  indexing: true,
});

export default rawAlertStore;