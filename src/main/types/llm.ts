import { Transcript } from './app-state.js';
import { Language } from './language.js';

export interface LLMRequest {
  /**
   * Interview language. Carried on the shared base so the three request kinds cannot drift, and
   * defaulted server-side, so omitting it against an older deployment still means English.
   */
  language?: Language;
}

/**
 * How much prose a suggestion should carry.
 *
 * Full-sentence mode is answers written out as they would be spoken. Hint-only mode is a headline
 * plus keyword bullets, for reading at a glance mid-interview, and is the default.
 *
 * The wire values are deliberately left as they are. They are the backend's contract
 * (`SuggestionMode` in its `app/schemas/suggestion.py`), which is deployed separately and still
 * names these modes the way the client used to; renaming the members without renaming the strings
 * keeps the client readable without requiring the two to ship together.
 */
export enum SuggestionMode {
  FullSentence = 'normal',
  HintOnly = 'professional',
}

/**
 * What the local gate concluded about the interviewer's last turn.
 *
 * Only two of `TurnVerdict`'s three values travel: a `Skip` never becomes a request at all. The
 * backend runs its own classifier for `Uncertain` and trusts `Answer`, which is what keeps a model
 * call off the path of every plainly answerable question. Mirrors `TurnVerdict` in the backend's
 * `app/schemas/suggestion.py`.
 */
export enum RequestTurnVerdict {
  Answer = 'answer',
  Uncertain = 'uncertain',
}

export interface GenerateLiveSuggestionRequest extends LLMRequest {
  profile_data: string;
  context: string;
  transcripts: Transcript[];
  mode: SuggestionMode;
  turn_verdict?: RequestTurnVerdict;
}

// action request reuses live fields but adds image names
export interface GenerateActionSuggestionRequest extends GenerateLiveSuggestionRequest {
  image_names: string[];
}

// summarize request reuses live fields
export interface GenerateSummarizeRequest extends LLMRequest {
  username: string;
  transcripts: Transcript[];
}
