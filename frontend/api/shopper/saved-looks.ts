import type { SavedLook, SavedLookCreateInput } from "@/types/shopper";

/**
 * PLACEHOLDER — no backend endpoint exists for Saved Looks (confirmed
 * absent across every router/schema/model on the backend; see
 * docs/frontend/SHOPPER_APP.md "API contract mismatches"). Per the Phase
 * 2.3 spec ("This can be frontend placeholder if backend endpoint is not
 * ready"), this persists to localStorage instead of a server, so the UI
 * (grid, empty state, delete) is fully functional end-to-end today.
 *
 * Swap this module's function bodies for real `apiClient` calls the moment
 * a `POST/GET/DELETE /saved-looks` contract exists — callers only depend on
 * these function signatures, matching the pattern already used by
 * features/auth/api.ts::forgotPassword.
 */

const STORAGE_KEY = "fitmirror.saved-looks.v1";
const SIMULATED_LATENCY_MS = 400;

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
}

function readStore(): SavedLook[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedLook[]) : [];
  } catch {
    return [];
  }
}

function writeStore(looks: SavedLook[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(looks));
}

export async function listSavedLooks(): Promise<SavedLook[]> {
  await delay();
  return readStore().sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createSavedLook(input: SavedLookCreateInput): Promise<SavedLook> {
  await delay();
  const look: SavedLook = {
    id: crypto.randomUUID(),
    tryon_job_id: input.tryon_job_id,
    result_image_key: input.result_image_key,
    garment_image_key: input.garment_image_key,
    label: input.label ?? null,
    created_at: new Date().toISOString(),
  };
  const looks = readStore();
  looks.push(look);
  writeStore(looks);
  return look;
}

export async function deleteSavedLook(lookId: string): Promise<void> {
  await delay();
  writeStore(readStore().filter((look) => look.id !== lookId));
}
