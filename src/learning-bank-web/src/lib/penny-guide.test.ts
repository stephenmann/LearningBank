import { beforeEach, describe, expect, it } from "vitest";
import {
  hasSeenPennyFeature,
  markPennyFeatureSeen,
  readPennyGuideState,
  type PennyGuideFeature,
} from "@/lib/penny-guide";

describe("penny guide storage", () => {
  const childId = "child-123";

  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts with an empty guide state", () => {
    expect(readPennyGuideState(childId)).toEqual({ seen: {} });
  });

  it("marks and reads seen features", () => {
    const feature: PennyGuideFeature = "balances";

    expect(hasSeenPennyFeature(childId, feature)).toBe(false);
    markPennyFeatureSeen(childId, feature);
    expect(hasSeenPennyFeature(childId, feature)).toBe(true);
  });

  it("handles invalid storage payload safely", () => {
    window.localStorage.setItem("learningbank:penny-guide:child-123", "not-json");

    expect(readPennyGuideState(childId)).toEqual({ seen: {} });
  });
});
