import { CREDITS_PER_MINUTE } from './consts';

/**
 * One rule for whether a session may start, shared by the live and mock start paths and the home
 * screen cards that front them.
 *
 * Both kinds of interview are metered by the minute on their audio socket at the same rate, and
 * the backend closes that socket when the balance reaches zero. A session started on a few seconds
 * of credit would be cut off almost at once, so starting asks for at least one minute's worth.
 *
 * The backend refuses only at zero, deliberately: it cannot tell a new session from a reconnect
 * in the middle of one, and refusing a reconnect with a few credits left would end an interview
 * that has already been paid for. This side can tell, so the one-minute minimum lives here.
 */

/** The rate to divide by: the backend's when it has said, the compiled-in mirror until then. */
export function effectiveRate(creditsPerMinute: number | undefined): number {
  return creditsPerMinute ?? CREDITS_PER_MINUTE;
}

/** The credits a session needs before it may start. */
export function minimumStartCredits(creditsPerMinute: number | undefined): number {
  return effectiveRate(creditsPerMinute);
}

/**
 * Whether this balance may start a session.
 *
 * An unknown balance (before the first ping answers) is let through rather than refused: the
 * backend still closes the socket at zero, and greying out both cards for the first seconds of
 * every launch would be the worse failure.
 */
export function canStartSession(
  credits: number | undefined,
  creditsPerMinute: number | undefined
): boolean {
  return credits === undefined || credits >= minimumStartCredits(creditsPerMinute);
}

/** Whole minutes this balance pays for. */
export function minutesCovered(credits: number, creditsPerMinute: number | undefined): number {
  return Math.max(0, Math.floor(credits / effectiveRate(creditsPerMinute)));
}

/**
 * How long a mock interview of `questionCount` questions usually runs, in minutes.
 *
 * An estimate for the setup screen, not a limit: the session is billed for the time it actually
 * takes, and a candidate who answers at length takes longer.
 */
export function mockSessionMinutes(questionCount: number): number {
  return Math.round(questionCount * 2.5);
}
