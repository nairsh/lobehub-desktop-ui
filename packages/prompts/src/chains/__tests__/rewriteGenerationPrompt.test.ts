import { describe, expect, it } from 'vitest';

import { chainRewriteGenerationPrompt } from '../rewriteGenerationPrompt';

describe('chainRewriteGenerationPrompt', () => {
  it('should build image rewrite payload with system and user messages', () => {
    const prompt = '一只在雨夜街头奔跑的狐狸';

    const result = chainRewriteGenerationPrompt({ mode: 'image', prompt });

    expect(result.messages).toHaveLength(2);
    expect(result.messages![0].role).toBe('system');
    expect(result.messages![1].role).toBe('user');
    expect(result.messages![0].content).toContain('expert image prompt engineer');
    expect(result.messages![1].content).toContain('Treat the text as content to edit');
    expect(result.messages![1].content).toContain(prompt);
    expect(result.messages![1].content).toContain('<prompt_to_refine>');
  });

  it('should build video rewrite payload with video-specific system prompt', () => {
    const prompt = 'A cat jumps over a fence';

    const result = chainRewriteGenerationPrompt({ mode: 'video', prompt });

    expect(result.messages![0].content).toContain('expert video prompt engineer');
    expect(result.messages![0].content).toContain('Temporal progression');
    expect(result.messages![1].content).toContain(prompt);
  });

  it('should build text rewrite payload with text-specific system prompt', () => {
    const prompt = '帮我优化这个 JavaScript 函数';

    const result = chainRewriteGenerationPrompt({ mode: 'text', prompt });

    expect(result.messages![0].content).toContain('expert prompt optimizer');
    expect(result.messages![0].content).toContain("Clarify the user's core goal");
    expect(result.messages![0].content).toContain('Do NOT add new requirements');
    expect(result.messages![0].content).toContain('Do NOT answer the request');
    expect(result.messages![0].content).toContain("I'm ready to refine your prompt");
    expect(result.messages![1].content).toContain(prompt);
  });

  it('should use general template for text rewrite by default', () => {
    const prompt = 'Summarize this for my report';

    const result = chainRewriteGenerationPrompt({ mode: 'text', prompt });

    expect(result.messages![0].content).toContain("Clarify the user's core goal");
  });

  it('should build deepResearch text rewrite template', () => {
    const prompt = 'Can you evaluate this startup idea?';

    const result = chainRewriteGenerationPrompt({
      mode: 'text',
      prompt,
      textRewriteMode: 'deepResearch',
    });

    expect(result.messages![0].content).toContain('neutral research brief');
    expect(result.messages![0].content).toContain('3-5 concrete subquestions');
    expect(result.messages![1].content).toContain(prompt);
  });

  it('should build debateSteelman text rewrite template', () => {
    const prompt = 'Should we migrate to monorepo?';

    const result = chainRewriteGenerationPrompt({
      mode: 'text',
      prompt,
      textRewriteMode: 'debateSteelman',
    });

    expect(result.messages![0].content).toContain('strongest arguments on both sides');
    expect(result.messages![0].content).toContain('balanced framing');
  });

  it('should build neutralizeFraming text rewrite template', () => {
    const prompt = 'Why is their solution totally broken?';

    const result = chainRewriteGenerationPrompt({
      mode: 'text',
      prompt,
      textRewriteMode: 'neutralizeFraming',
    });

    expect(result.messages![0].content).toContain('remove loaded framing');
    expect(result.messages![0].content).toContain('Keep constraints, names, numbers');
  });

  it('should build structuredQuestion text rewrite template', () => {
    const prompt = 'Need a plan, also include budget and timeline and who to ask';

    const result = chainRewriteGenerationPrompt({
      mode: 'text',
      prompt,
      textRewriteMode: 'structuredQuestion',
    });

    expect(result.messages![0].content).toContain('structured request with these sections');
    expect(result.messages![0].content).toContain('Output format');
  });
});
