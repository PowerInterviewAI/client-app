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
