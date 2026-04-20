interface BuildRefineSuggestionParams {
  currentPrompt: string;
  rewrittenPrompt: string;
}

export const buildRefineSuggestion = ({
  currentPrompt,
  rewrittenPrompt,
}: BuildRefineSuggestionParams) => {
  const current = currentPrompt.trimEnd();
  const rewritten = rewrittenPrompt.trim();

  if (!rewritten) return '';
  if (!current) return rewritten;
  if (rewritten === current) return '';
  if (rewritten.startsWith(current)) return rewritten.slice(current.length);

  return rewritten;
};
