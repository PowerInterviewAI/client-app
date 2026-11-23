import { CircleCheck, FileText, Hash, Loader, Target } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { showExportSuccessToast } from '@/components/custom/export-success-toast';
import { SafeMarkdown } from '@/components/custom/safe-markdown';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { type Translation, useT } from '@/i18n';
import { cn } from '@/lib/utils';
import type { MockInterviewSessionState } from '@/types/mock-interview';

interface ReportScreenProps {
  session: MockInterviewSessionState;
  onExport: (format: 'docx' | 'md') => Promise<string | null>;
  onRetryScoring: () => Promise<void>;
  onPracticeAgain: () => Promise<void>;
  onDone: () => Promise<void>;
}

function scoreVerdict(t: Translation, score: number): string {
  if (score >= 85) return t.mock.report.verdictExcellent;
  if (score >= 70) return t.mock.report.verdictStrong;
  if (score >= 50) return t.mock.report.verdictDeveloping;
  return t.mock.report.verdictNeedsWork;
}

/**
 * The colour a score is drawn in, banded on the same thresholds as `scoreVerdict` so the colour
 * and the word under the number never disagree.
 */
function scoreTone(score: number): { text: string; stroke: string; bar: string } {
  if (score >= 85)
    return { text: 'text-emerald-500', stroke: 'stroke-emerald-500', bar: 'bg-emerald-500' };
  if (score >= 70) return { text: 'text-sky-500', stroke: 'stroke-sky-500', bar: 'bg-sky-500' };
  if (score >= 50)
    return { text: 'text-amber-500', stroke: 'stroke-amber-500', bar: 'bg-amber-500' };
  return { text: 'text-rose-500', stroke: 'stroke-rose-500', bar: 'bg-rose-500' };
}

/** The overall score as a ring, the number inside it. Decorative - the number is read as text. */
function ScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const tone = scoreTone(clamped);

  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="10" className="stroke-muted" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className={cn(tone.stroke, 'transition-[stroke-dashoffset] duration-700 ease-out')}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
        />
      </svg>
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center text-4xl font-semibold tabular-nums',
          tone.text
        )}
      >
        {score}
      </span>
    </div>
  );
}

export function ReportScreen({
  session,
  onExport,
  onRetryScoring,
  onPracticeAgain,
  onDone,
}: ReportScreenProps) {
  const t = useT();
  const { report, reportError, rescoring, answers } = session;
  const [saving, setSaving] = useState<'docx' | 'md' | null>(null);
  const [busy, setBusy] = useState<'again' | 'done' | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // This screen replaces SessionScreen the moment the session reaches Finished, not through a
  // real navigation, so nothing else moves focus here on its own.
  //
  // Keyed on the report arriving rather than on mount alone, because a successful retry is the
  // same kind of replacement one step further in: it unmounts the failure alert along with the
  // Score again button the candidate just pressed, which drops focus to the body and loses their
  // place in a screen that has just filled up with the score they were waiting for. The flag
  // only ever flips once per session, so nothing steals focus while they are reading.
  const hasReport = report !== null;
  useEffect(() => {
    headingRef.current?.focus();
  }, [hasReport]);

  const save = async (format: 'docx' | 'md') => {
    setSaving(format);
    try {
      const filePath = await onExport(format);
      // The same confirmation the live export and the save-before-clearing prompt give, rather
      // than a plain toast: a save dialog's own path is gone the moment it closes, and this was
      // the one export of the three that left "where did that go" unanswered.
      if (filePath) showExportSuccessToast(filePath, format);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.mock.report.exportFailed);
    } finally {
      setSaving(null);
    }
  };

  const practiceAgain = async () => {
    setBusy('again');
    try {
      await onPracticeAgain();
    } finally {
      setBusy(null);
    }
  };

  const done = async () => {
    setBusy('done');
    try {
      await onDone();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center overflow-y-auto p-8">
      <div className="w-full max-w-3xl space-y-6">
        {/* Visually hidden: the score is the visual headline, but this route still needs a
            landmark for screen-reader heading navigation to land on. */}
        <h1 ref={headingRef} tabIndex={-1} className="sr-only">
          {t.mock.report.heading}
        </h1>
        {reportError && (
          <Alert variant="destructive">
            {/* `gap-3` overrides AlertDescription's own `gap-1`: it is a grid, and the default
                gap is sized for two lines of copy rather than copy followed by a control. */}
            <AlertDescription className="gap-3">
              <span>{t.mock.report.scoreFailed(reportError)}</span>
              {/* The answers are kept, so scoring can be asked for again without re-running the
                  interview. Not automatic - see `retryScoring` in the service for why the spend
                  is the candidate's to make. */}
              <Button
                variant="outline"
                size="sm"
                disabled={rescoring}
                onClick={() => void onRetryScoring()}
              >
                {rescoring ? (
                  <>
                    <Loader className="animate-spin" />
                    {t.mock.report.scoring}
                  </>
                ) : (
                  t.mock.report.scoreAgain
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {report && (
          <Card className="py-5">
            <CardContent className="flex flex-col items-center gap-6 sm:flex-row">
              {/* The number and verdict below read as two unrelated lines to a screen reader
                  without this - visually the "82" is self-evidently a score because of its size
                  and position, which carries no meaning once read aloud in sequence. */}
              <h2 className="sr-only">{t.mock.report.overallScore}</h2>
              <ScoreRing score={report.overall_score} />
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t.mock.report.overallScore}
                </p>
                <p
                  className={cn(
                    'mt-1 text-2xl font-semibold tracking-tight',
                    scoreTone(report.overall_score).text
                  )}
                >
                  {scoreVerdict(t, report.overall_score)}
                </p>
                {/* One bar per question, so the shape of the interview - a strong start that
                    tailed off, one weak answer among good ones - is visible before reading any. */}
                {report.questions.length > 0 && (
                  <div className="mt-4 flex h-10 items-end gap-1" aria-hidden="true">
                    {report.questions.map((q, i) => (
                      <div
                        key={i}
                        title={`${i + 1}. ${q.score}`}
                        className={cn('flex-1 rounded-sm', scoreTone(q.score).bar)}
                        style={{ height: `${Math.max(8, q.score)}%` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {report && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <h2 className="flex items-center gap-2 leading-none font-semibold text-sm">
                  <CircleCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                  {t.mock.report.strengths}
                </h2>
              </CardHeader>
              <CardContent>
                {report.strengths.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {report.strengths.map((s, i) => (
                      <li key={i} dir="auto">
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">{t.mock.report.nothingNoted}</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <h2 className="flex items-center gap-2 leading-none font-semibold text-sm">
                  <Target className="h-4 w-4 text-amber-500" aria-hidden="true" />
                  {t.mock.report.gaps}
                </h2>
              </CardHeader>
              <CardContent>
                {report.gaps.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {report.gaps.map((g, i) => (
                      <li key={i} dir="auto">
                        {g}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">{t.mock.report.nothingNoted}</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <h2 className="leading-none font-semibold text-sm">{t.mock.report.perQuestion}</h2>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {(report?.questions.length ? report.questions : answers).map((entry, i) => {
                const scored = 'score' in entry ? entry : null;
                return (
                  <AccordionItem key={i} value={`q-${i}`}>
                    <AccordionTrigger>
                      <span className="flex flex-1 items-center gap-2 pr-2">
                        <span dir="auto" className="line-clamp-1 flex-1 text-left">
                          {entry.question}
                        </span>
                        {scored && (
                          <span className="flex shrink-0 items-center gap-2">
                            <span
                              className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"
                              aria-hidden="true"
                            >
                              <span
                                className={cn(
                                  'block h-full rounded-full',
                                  scoreTone(scored.score).bar
                                )}
                                style={{ width: `${Math.max(0, Math.min(100, scored.score))}%` }}
                              />
                            </span>
                            <span
                              className={cn(
                                'w-7 text-right text-sm font-semibold tabular-nums',
                                scoreTone(scored.score).text
                              )}
                            >
                              {scored.score}
                            </span>
                          </span>
                        )}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          {t.mock.report.yourAnswer}
                        </p>
                        <p dir="auto" className="text-sm">
                          {entry.answer || t.mock.report.noAnswerRecorded}
                        </p>
                      </div>
                      {scored && (
                        <>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">
                              {t.mock.report.score}
                            </p>
                            <p dir="auto" className="text-sm">
                              {scored.justification}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">
                              {t.mock.report.strongerAnswer}
                            </p>
                            <SafeMarkdown content={scored.stronger_answer} />
                          </div>
                        </>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={saving !== null}
              aria-busy={saving === 'docx'}
              onClick={() => void save('docx')}
            >
              {saving === 'docx' ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              {t.mock.report.saveAsWord}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={saving !== null}
              aria-busy={saving === 'md'}
              onClick={() => void save('md')}
            >
              {saving === 'md' ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Hash className="mr-2 h-4 w-4" />
              )}
              {t.mock.report.saveAsMarkdown}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={busy !== null}
              onClick={() => void practiceAgain()}
            >
              {t.mock.report.practiseAgain}
            </Button>
            <Button size="sm" disabled={busy !== null} onClick={() => void done()}>
              {t.mock.report.done}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
