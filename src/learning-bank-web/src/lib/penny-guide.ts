export type PennyGuideFeature =
  | "intro-complete"
  | "balances"
  | "add-deposit"
  | "transfer-to-savings"
  | "request-from-savings"
  | "pending-requests"
  | "history"
  | "deposit-form"
  | "transfer-form"
  | "request-form";

interface PennyGuideState {
  seen: Partial<Record<PennyGuideFeature, true>>;
}

const STORAGE_PREFIX = "learningbank:penny-guide:";

function getStorageKey(childId: string) {
  return `${STORAGE_PREFIX}${childId}`;
}

export function readPennyGuideState(childId: string): PennyGuideState {
  if (typeof window === "undefined") {
    return { seen: {} };
  }

  const raw = window.localStorage.getItem(getStorageKey(childId));
  if (!raw) {
    return { seen: {} };
  }

  try {
    const parsed = JSON.parse(raw) as PennyGuideState;
    return {
      seen: parsed.seen ?? {},
    };
  } catch {
    return { seen: {} };
  }
}

function writePennyGuideState(childId: string, state: PennyGuideState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getStorageKey(childId), JSON.stringify(state));
}

export function hasSeenPennyFeature(childId: string, feature: PennyGuideFeature): boolean {
  const state = readPennyGuideState(childId);
  return state.seen[feature] === true;
}

export function markPennyFeatureSeen(childId: string, feature: PennyGuideFeature) {
  const state = readPennyGuideState(childId);
  state.seen[feature] = true;
  writePennyGuideState(childId, state);
}
