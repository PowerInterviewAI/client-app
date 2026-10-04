import { ApiRequestError } from '../api/client.js';
import { uiStrings } from './ui-strings.js';

/**
 * What to put on a suggestion card that failed.
 *
 * The two messages this writes itself follow the chrome language - they are rendered verbatim on
 * the card the candidate is reading. Anything else is the error's own message, passed through:
 * for an `ApiRequestError` that is the backend's text, and for everything else it is a fault
 * whose wording is more useful to whoever is debugging it than to the candidate.
 */
export function getSuggestionErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    const strings = uiStrings();
    if (error.status === 429) {
      return strings.suggestionErrors.tooManyRequests;
    }
    return strings.suggestionErrors.generateFailed;
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
  const strings = uiStrings();
  return stage === 'connect'
    ? strings.suggestionErrors.cannotReachServer
    : strings.suggestionErrors.responseTimedOut;
}
