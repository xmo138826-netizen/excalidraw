import type { StreamChunk } from "../types";

/**
 * Transform Zhipu AI content stream to Excalidraw-compatible format
 * @param contentGenerator - AsyncGenerator yielding content from Zhipu AI
 * @returns AsyncGenerator yielding Excalidraw StreamChunk objects
 */
export async function* transformToExcalidrawStream(
  contentGenerator: AsyncGenerator<string, void, unknown>
): AsyncGenerator<StreamChunk, void, unknown> {
  try {
    for await (const content of contentGenerator) {
      yield {
        type: "content",
        delta: content,
      };
    }

    // Send done signal when stream completes
    yield {
      type: "done",
      finishReason: "stop",
    };
  } catch (error) {
    // Send error signal if something goes wrong
    yield {
      type: "error",
      error: {
        message: error instanceof Error ? error.message : "Unknown error",
        status: 500,
      },
    };
  }
}

/**
 * Format a StreamChunk as SSE (Server-Sent Events) data
 * @param chunk - StreamChunk to format
 * @returns Formatted SSE string
 */
export function formatSSE(chunk: StreamChunk): string {
  const data = JSON.stringify(chunk);
  return `data: ${data}\n\n`;
}

/**
 * Format SSE done signal
 * @returns SSE done signal string
 */
export function formatSSEDone(): string {
  return "data: [DONE]\n\n";
}

/**
 * Create a resolvable promise for manual stream completion
 * Useful for testing or manual stream control
 */
export function createManualStreamController() {
  let resolve: ((value: boolean) => void) | null = null;
  const promise = new Promise<boolean>((r) => {
    resolve = r;
  });

  return {
    promise,
    complete: () => resolve?.(true),
  };
}
