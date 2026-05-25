import type { ProviderId } from "./providers.js";

export type PhaseId = "spec" | "code" | "review";

/** ANSI color key from term.c — matches the SPEC §4 layer color palette. */
export type PhaseColor = "blue" | "green" | "red";

export interface Phase {
  id: PhaseId;
  label: string;
  hint: string;
  /** Layer color from SPEC §4: Specify=blue, Implement=green, Validate=red. */
  color: PhaseColor;
}

export const PHASES: Phase[] = [
  {
    id: "spec",
    label: "Spec phase",
    hint: "planner · curator · specter · qa · researcher",
    color: "blue",   // Specify layer color
  },
  {
    id: "code",
    label: "Code phase",
    hint: "coder · reviewer · tester",
    color: "green",  // Implement layer color
  },
  {
    id: "review",
    label: "Review phase",
    hint: "auditor · pr · tl",
    color: "red",    // Validate layer color
  },
];

export type PhaseMap = Record<PhaseId, ProviderId>;

export function singleProvider(id: ProviderId): PhaseMap {
  return { spec: id, code: id, review: id };
}

export function usedProviders(map: PhaseMap): ProviderId[] {
  return [...new Set(Object.values(map))] as ProviderId[];
}
