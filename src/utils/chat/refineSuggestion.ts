interface BuildRefineSuggestionParams {
  currentPrompt: string;
  rewrittenPrompt: string;
}

export interface RefineSuggestionResult {
  prefix: string;
  suggestion: string;
}

export const buildRefineSuggestion = ({
  currentPrompt,
  rewrittenPrompt,
}: BuildRefineSuggestionParams): RefineSuggestionResult | null => {
  const current = currentPrompt.trimEnd();
  const rewritten = rewrittenPrompt.trim();

  if (!rewritten) return null;
  if (!current) return { prefix: '', suggestion: rewritten };
  if (rewritten === current) return null;

  const minLen = Math.min(current.length, rewritten.length);
  let commonLen = 0;
  for (let i = 0; i < minLen; i++) {
    if (current[i] !== rewritten[i]) break;
    commonLen = i + 1;
  }

  return { prefix: current.slice(0, commonLen), suggestion: rewritten.slice(commonLen) };
};
