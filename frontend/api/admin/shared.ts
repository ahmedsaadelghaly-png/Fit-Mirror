/** Shared by every mocked admin API module — simulates a network round-trip so loading states are real and observable, not instant. */
const SIMULATED_LATENCY_MS = 350;

export function delay(ms: number = SIMULATED_LATENCY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
