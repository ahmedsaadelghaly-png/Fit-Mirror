import { MOCK_FEATURE_FLAGS } from "@/api/admin/mock-data";
import { delay } from "@/api/admin/shared";
import type { FeatureFlag, FeatureFlagKey } from "@/types/admin";

/**
 * PLACEHOLDER — no feature-flag model, table, or endpoint exists anywhere
 * in the backend (`backend/app/core/config.py` only has two unrelated
 * infra booleans — `RATE_LIMIT_ENABLED`, `SECURE_HEADERS_ENABLED`, no
 * per-flag/per-environment/rollout model). Persisted to localStorage —
 * unlike the read-mostly mocks elsewhere in this module, toggling a flag
 * here is the one admin action that should durably "stick" across a
 * refresh, since it's the whole point of a feature-flag UI. Seeded from
 * MOCK_FEATURE_FLAGS on first read.
 */

const STORAGE_KEY = "fitmirror.admin.feature-flags.v1";

function readStore(): FeatureFlag[] {
  if (typeof window === "undefined") return MOCK_FEATURE_FLAGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FeatureFlag[]) : MOCK_FEATURE_FLAGS;
  } catch {
    return MOCK_FEATURE_FLAGS;
  }
}

function writeStore(flags: FeatureFlag[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
}

export async function listFeatureFlags(): Promise<FeatureFlag[]> {
  await delay();
  return readStore();
}

export async function updateFeatureFlag(
  key: FeatureFlagKey,
  changes: Partial<Pick<FeatureFlag, "enabled" | "environment" | "rolloutPercentage">>,
): Promise<FeatureFlag[]> {
  await delay();
  const flags = readStore().map((flag) => (flag.key === key ? { ...flag, ...changes } : flag));
  writeStore(flags);
  return flags;
}
