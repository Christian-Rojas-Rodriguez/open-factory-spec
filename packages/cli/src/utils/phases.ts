import type { ProviderId } from "./providers.js";

export type PhaseId = "spec" | "code" | "review";

export interface Phase {
  id: PhaseId;
  label: string;
  hint: string;
}

export const PHASES: Phase[] = [
  {
    id: "spec",
    label: "Spec phase",
    hint: "planner · curator · specter · qa · researcher",
  },
  {
    id: "code",
    label: "Code phase",
    hint: "coder · reviewer · tester",
  },
  {
    id: "review",
    label: "Review phase",
    hint: "auditor · pr · tl",
  },
];

export type PhaseMap = Record<PhaseId, ProviderId>;

export function singleProvider(id: ProviderId): PhaseMap {
  return { spec: id, code: id, review: id };
}

export function usedProviders(map: PhaseMap): ProviderId[] {
  return [...new Set(Object.values(map))] as ProviderId[];
}
