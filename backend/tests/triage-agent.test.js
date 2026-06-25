import triageAgent from "../agents/triage-agent.js";

(async () => {
  const result =
    await triageAgent.run({
      input:
        "CRITICAL: Payment gateway unavailable. Customers unable to checkout.",
    });

  console.log(
    "\nAGENT RESPONSE\n"
  );

  console.log(
    result.text
  );

  try {
    JSON.parse(
      result.text
    );

    console.log(
      "\n✅ JSON VALID"
    );
  } catch {
    console.log(
      "\n❌ INVALID JSON"
    );
  }
})();