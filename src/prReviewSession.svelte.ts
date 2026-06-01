import { prReviewIsCorrect } from "./completion";
import type { Scenario } from "./types";

export type ReviewDecision = "approve" | "request_changes";

export type PrReviewSessionOptions = {
  runtime: () => Scenario | null;
  refreshRuntime: () => void;
  addTerminalLines: (lines: string[]) => void;
  onCompleted: () => void;
  onSave: () => void;
};

export function createPrReviewSession(options: PrReviewSessionOptions) {
  function markReviewChanged(note: string): void {
    const runtime = options.runtime();
    if (!runtime?.prReview) return;

    runtime.flags.reviewPassed = false;
    runtime.awsResources[0].status = "failed";
    runtime.awsResources[0].note = note;
    options.refreshRuntime();
    options.onSave();
  }

  return {
    isCorrect(): boolean {
      const runtime = options.runtime();
      return runtime ? prReviewIsCorrect(runtime) : false;
    },
    setDecision(decision: ReviewDecision): void {
      const runtime = options.runtime();
      if (!runtime?.prReview) return;

      runtime.prReview.decision = decision;
      markReviewChanged("Review decision has not passed validation.");
    },
    toggleFinding(findingId: string): void {
      const runtime = options.runtime();
      if (!runtime?.prReview) return;

      runtime.prReview.findings = runtime.prReview.findings.map((finding) =>
        finding.id === findingId ? { ...finding, selected: !finding.selected } : finding,
      );
      markReviewChanged("Review findings changed. Submit the review again.");
    },
    submit(): void {
      const runtime = options.runtime();
      if (!runtime?.prReview) return;

      const passed = prReviewIsCorrect(runtime);
      runtime.flags.reviewPassed = passed;
      runtime.awsResources[0].status = passed ? "success" : "failed";
      runtime.awsResources[0].note = passed
        ? "Review decision and required findings match the pull request risk."
        : "Review does not match the pull request risk. Check the decision and selected findings.";
      options.refreshRuntime();
      options.addTerminalLines([passed ? "PR review accepted." : "PR review rejected by training checks."]);
      options.onCompleted();
      options.onSave();
    },
    applyExpectedReview(): void {
      const runtime = options.runtime();
      if (!runtime?.prReview) return;

      runtime.prReview.decision = runtime.prReview.expectedDecision;
      runtime.prReview.findings = runtime.prReview.findings.map((finding) => ({
        ...finding,
        selected: finding.required,
      }));
      options.refreshRuntime();
    },
  };
}
