import { validateRawAlert } from "./utils/validate-raw-alert.js";

// Test 1: Valid alert
const validAlert = {
  id: "alert_123",
  source: "email",
  payload: "Test alert",
  receivedAt: new Date().toISOString(),
  metadata: {}
};

console.log("Test 1: Valid alert");
console.log(validateRawAlert(validAlert));
console.log("");

// Test 2: Missing required field (id)
const missingIdAlert = {
  source: "email",
  payload: "Test alert",
  receivedAt: new Date().toISOString(),
  metadata: {}
};

console.log("Test 2: Missing id");
console.log(validateRawAlert(missingIdAlert));
console.log("");

// Test 3: Invalid source enum
const invalidSourceAlert = {
  id: "alert_123",
  source: "invalid_source",
  payload: "Test alert",
  receivedAt: new Date().toISOString(),
  metadata: {}
};

console.log("Test 3: Invalid source");
console.log(validateRawAlert(invalidSourceAlert));
console.log("");

// Test 4: Invalid date-time format
const invalidDateAlert = {
  id: "alert_123",
  source: "email",
  payload: "Test alert",
  receivedAt: "not-a-date",
  metadata: {}
};

console.log("Test 4: Invalid date-time");
console.log(validateRawAlert(invalidDateAlert));
console.log("");