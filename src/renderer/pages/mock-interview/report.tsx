import { FileText, Hash, Loader } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { showExportSuccessToast } from '@/components/custom/export-success-toast';
import { SafeMarkdown } from '@/components/custom/safe-markdown';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { MockInterviewSessionState } from '@/types/mock-interview';

interface ReportScreenProps {
  session: MockInterviewSessionState;
  onExport: (format: 'docx' | 'md') => Promise<string | null>;
  onPracticeAgain: () => Promise<void>;
  onDone: () => Promise<void>;
}

function scoreVerdict(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Strong';
  if (score >= 50) return 'Developing';
  return 'Needs work';
}

export function ReportScreen({ session, onExport, onPracticeAgain, onDone }: ReportScreenProps) {
  const { report, reportError, answers } = session;
  const [saving, setSaving] = useState<'docx' | 'md' | null>(null);
  const [busy, setBusy] = useState<'again' | 'done' | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // This screen replaces SessionScreen the moment the session reaches Finished, not through a
  // real navigation, so nothing else moves focus here on its own.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const save = async (format: 'docx' | 'md') => {
    setSaving(format);
    try {
      const filePath = await onExport(format);
      // The same confirmation the live export and the save-before-clearing prompt give, rather
      // than a plain toast: a save dialog's own path is gone the moment it closes, and this was
      // the one export of the three that left "where did that go" unanswered.
      if (filePath) showExportSuccessToast(filePath, format);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export the report');
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
          Mock interview report
        </h1>
        {reportError && (
          <Alert variant="destructive">
            <AlertDescription>
              The overall score could not be produced ({reportError}). Your answers are still shown
              below and can still be exported.
            </AlertDescription>
          </Alert>
        )}

        {report && (
          <Card>
            <CardHeader className="items-center text-center">
              {/* The number and verdict below read as two unrelated lines to a screen reader
                  without this - visually the "82" is self-evidently a score because of its
                  size and position, which carries no meaning once read aloud in sequence. */}
              <h2 className="sr-only">Overall score</h2>
              <p className="text-5xl font-semibold tabular-nums">{report.overall_score}</p>
              <p className="text-sm text-muted-foreground">{scoreVerdict(report.overall_score)}</p>
              <div className="w-full pt-2">
                <Progress value={report.overall_score} />
              </div>
            </CardHeader>
          </Card>
        )}

        {report && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <h2 className="leading-none font-semibold text-sm">Strengths</h2>
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
                  <p className="text-sm text-muted-foreground">Nothing specific noted.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <h2 className="leading-none font-semibold text-sm">Gaps</h2>
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
                  <p className="text-sm text-muted-foreground">Nothing specific noted.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <h2 className="leading-none font-semibold text-sm">Per-question breakdown</h2>
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
                        {scored && <Badge variant="secondary">{scored.score}</Badge>}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Your answer</p>
                        <p dir="auto" className="text-sm">
                          {entry.answer || '(no answer recorded)'}
                        </p>
                      </div>
                      {scored && (
                        <>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Score</p>
                            <p dir="auto" className="text-sm">
                              {scored.justification}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Stronger answer</p>
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
              Save as Word
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
              Save as Markdown
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => void practiceAgain()}>
              Practise again
            </Button>
            <Button size="sm" disabled={busy !== null} onClick={() => void done()}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
