export type TipsSessionOptions = {
  revealedTipCount?: number;
  onChange: () => void;
};

export function createTipsSession(options: TipsSessionOptions) {
  let revealedTipCount = $state(options.revealedTipCount ?? 0);

  return {
    get revealedTipCount() {
      return revealedTipCount;
    },
    visibleTips(tips: string[]): string[] {
      return tips.slice(0, revealedTipCount);
    },
    reset(count = 0): void {
      revealedTipCount = count;
    },
    reveal(tips: string[]): void {
      if (revealedTipCount >= tips.length) return;
      revealedTipCount += 1;
      options.onChange();
    },
  };
}
