import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { AccountForm } from '@/hooks/use-account-form';

// Kept in sync with the backend's MAX_PROFILE_DATA_LENGTH / MAX_CONTEXT_LENGTH (app/cfg/llm.py)
const MAX_FIELD_LENGTH = 128_000;
// Kept in sync with the backend's MAX_USERNAME_LENGTH (app/cfg/llm.py)
const MAX_NAME_LENGTH = 1_000;

/**
 * How much of a long field's budget is left, once it is close enough to matter.
 *
 * `maxLength` on a textarea truncates a paste silently, which for these two fields means a CV or
 * a job description arriving 2,000 characters shorter than the one the user copied, with nothing
 * on screen having said so. Hidden below the threshold: a counter over an empty box is noise,
 * and the limit is generous enough that most sessions never approach it.
 */
const LIMIT_NOTICE_RATIO = 0.9;

function FieldLimitNotice({ value, max }: { value: string; max: number }) {
  if (value.length < max * LIMIT_NOTICE_RATIO) return null;

  const atLimit = value.length >= max;
  return (
    <p
      className={`text-[11px] tabular-nums ${atLimit ? 'text-destructive' : 'text-muted-foreground'}`}
      // Announced when it changes rather than only on focus: the moment it matters is a paste
      // that was cut short, which is not a keystroke the user is watching the counter for.
      role="status"
    >
      {atLimit
        ? `Character limit reached (${max.toLocaleString()}). Extra text was not added.`
        : `${(max - value.length).toLocaleString()} characters left`}
    </p>
  );
}

function RequiredMark() {
  return (
    <span className="text-destructive" aria-hidden="true">
      {' '}
      *
    </span>
  );
}

/**
 * The three account fields, one component each.
 *
 * Split rather than shipped as one block because the first-run wizard asks for the name and CV on
 * one step and the job context on the next, while the account page shows all three together. Each
 * takes the shared `AccountForm` so neither surface holds its own copy of the state.
 */
/**
 * Every field is disabled while the account is still loading. Not cosmetic: the fetch runs to
 * 30 seconds, the fields render immediately, and typing into an empty-looking form before it
 * lands is exactly the case where the response would overwrite what was typed.
 */
export function FullNameField({ form }: { form: AccountForm }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="account-full-name">
        Full name
        <RequiredMark />
      </Label>
      <Input
        id="account-full-name"
        required
        value={form.fullName}
        onChange={(e) => form.setFullName(e.target.value)}
        placeholder="The name you go by in the interview"
        maxLength={MAX_NAME_LENGTH}
        disabled={form.loading}
      />
    </div>
  );
}

export function ProfileField({ form }: { form: AccountForm }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor="account-profile">
          Profile
          <RequiredMark />
        </Label>
        <FieldLimitNotice value={form.profileData} max={MAX_FIELD_LENGTH} />
      </div>
      <Textarea
        id="account-profile"
        required
        value={form.profileData}
        onChange={(e) => form.setProfileData(e.target.value)}
        disabled={form.loading}
        placeholder="Paste your CV/resume, LinkedIn profile, or a short bio. Suggestions are written from this, so more detail means answers that sound like you."
        className="min-h-40 max-h-80 overflow-auto text-sm"
        maxLength={MAX_FIELD_LENGTH}
      />
    </div>
  );
}

export function ContextField({ form }: { form: AccountForm }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor="account-context">Context</Label>
        <FieldLimitNotice value={form.context} max={MAX_FIELD_LENGTH} />
      </div>
      <Textarea
        id="account-context"
        value={form.context}
        onChange={(e) => form.setContext(e.target.value)}
        disabled={form.loading}
        placeholder="Paste the job description, the role requirements, or anything else about the interview you are preparing for."
        className="min-h-40 max-h-80 overflow-auto text-sm"
        maxLength={MAX_FIELD_LENGTH}
      />
    </div>
  );
}
