import { LLMError } from './types';

describe('LLM Error and Retry Logic', () => {
  it('identifies transient errors correctly', () => {
    const quotaError = new LLMError(
      'You exceeded your quota',
      429,
      'insufficient_quota',
      false,
    );
    const rateLimitError = new LLMError('Rate limit', 429, 'rate_limit', true);
    const serverError = new LLMError('Internal error', 500, undefined, true);
    const authError = new LLMError('Invalid key', 401, undefined, false);

    expect(quotaError.isTransient).toBe(false);
    expect(rateLimitError.isTransient).toBe(true);
    expect(serverError.isTransient).toBe(true);
    expect(authError.isTransient).toBe(false);
  });
});
