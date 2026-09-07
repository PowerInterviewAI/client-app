import { ApiRequestError } from '../api/client.js';

export function getSuggestionErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 429) {
      return 'Too many requests. Please try again later.';
    }
    return 'Failed to generate response.';
  }
  return error instanceof Error ? error.message : String(error);
}

/**
 * Which deadline a suggestion request was sitting on when it was abandoned.
 *
 * All three abort the same controller with the same `TimeoutError`, so the stage is the only
 * thing that distinguishes them - and they fail for unrelated reasons. `connect` is the request
 * never reaching the backend, which trying again on the same connection cannot fix; the other
 * two are the model, which it often can.
 */
export type SuggestionStallStage = 'connect' | 'first-token' | 'stream';

/** What to tell the candidate about a request abandoned at `stage`. */
export function getStallMessage(stage: SuggestionStallStage): string {
  return stage === 'connect'
    ? 'Could not reach the server. Check your connection and try again.'
    : 'The response timed out. Please try again.';
}
