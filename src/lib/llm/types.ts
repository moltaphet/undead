import type { AppError } from "../errors";
import type { TokenUsage } from "../usage";

export type ProviderName = "gemini" | "anthropic";
export type Effort = "none" | "low" | "medium" | "high";
export type StopReason = "end" | "max_tokens" | "refusal";

export interface JsonRequest {
  system: string;
  user: string;
  maxTokens: number;
  effort: Effort;
}

export interface JsonResponse {
  text: string;
  stopReason: StopReason;
  usage?: TokenUsage | null;
  /** The model that actually answered (it can differ from the configured one after a fallback). */
  model?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  system: string;
  messages: ChatMessage[];
  maxTokens: number;
}

/** A started streaming reply. `finish()` resolves once the stream has ended. */
export interface ChatStream {
  chunks: AsyncIterable<string>;
  finish(): Promise<{ refused: boolean; usage?: TokenUsage | null; model?: string }>;
  abort(): void;
}

/** The only surface the rest of the app uses to talk to a model. */
export interface LlmProvider {
  readonly name: ProviderName;
  readonly model: string;
  completeJson(req: JsonRequest): Promise<JsonResponse>;
  streamChat(req: ChatRequest): ChatStream;
  /** Maps SDK errors to user-safe AppErrors. Details are logged server-side only. */
  toError(err: unknown): AppError;
}
