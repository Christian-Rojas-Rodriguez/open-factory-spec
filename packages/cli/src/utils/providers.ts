export type ProviderId = "anthropic" | "openai" | "opencode" | "gemini";

export interface Provider {
  id: ProviderId;
  label: string;
  toolName: string;
  /** Name of the main agent-instructions file expected by the tool. */
  memoryFile: string;
  /** CLI binary to open the tool after scaffolding. */
  toolCommand: string;
}

export const PROVIDERS: Provider[] = [
  {
    id: "anthropic",
    label: "Anthropic — Claude Code",
    toolName: "Claude Code",
    memoryFile: "CLAUDE.md",
    toolCommand: "claude",
  },
  {
    id: "openai",
    label: "OpenAI — Codex CLI",
    toolName: "Codex CLI",
    memoryFile: "AGENTS.md",
    toolCommand: "codex",
  },
  {
    id: "opencode",
    label: "OpenCode",
    toolName: "OpenCode",
    memoryFile: "AGENTS.md",
    toolCommand: "opencode",
  },
  {
    id: "gemini",
    label: "Gemini — Gemini CLI",
    toolName: "Gemini CLI",
    memoryFile: "GEMINI.md",
    toolCommand: "gemini",
  },
];

export const DEFAULT_PROVIDER: Provider = PROVIDERS[0]!;

export function findProvider(id: string): Provider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

export function providerIds(): string {
  return PROVIDERS.map((p) => p.id).join(", ");
}
