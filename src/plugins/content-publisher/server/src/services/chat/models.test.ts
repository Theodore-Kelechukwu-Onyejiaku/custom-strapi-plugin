// services/chat/models.test.ts
//
// The chat's model allowlist: the browser may only pick a model on the list, and the
// default always comes from ANTHROPIC_MODEL or the fallback.

import { afterEach, describe, expect, it } from 'vitest';
import { chatModels, defaultModel, resolveModel } from './models';

afterEach(() => {
  delete process.env.ANTHROPIC_MODEL;
});

describe('defaultModel', () => {
  it('falls back to Claude Haiku 4.5', () => {
    expect(defaultModel()).toBe('claude-haiku-4-5');
  });

  it('uses ANTHROPIC_MODEL when it is set', () => {
    process.env.ANTHROPIC_MODEL = 'claude-sonnet-5-5';
    expect(defaultModel()).toBe('claude-sonnet-5-5');
  });
});

describe('resolveModel', () => {
  it('accepts a model on the list', () => {
    expect(resolveModel('claude-opus-5-5')).toBe('claude-opus-5-5');
  });

  it('replaces a model not on the list with the default', () => {
    expect(resolveModel('some-other-model')).toBe('claude-haiku-4-5');
    expect(resolveModel(undefined)).toBe('claude-haiku-4-5');
  });
});

describe('chatModels', () => {
  it('adds an ANTHROPIC_MODEL that is not on the list, so it stays selectable', () => {
    process.env.ANTHROPIC_MODEL = 'claude-custom';
    const ids = chatModels().map((model) => model.id);
    expect(ids[0]).toBe('claude-custom');
    expect(resolveModel('claude-custom')).toBe('claude-custom');
  });
});
