import { renderHook } from '@testing-library/react-native';

import { useSentenceBuffer } from './use-sentence-buffer';

type UseSentenceBufferOptions = Parameters<typeof useSentenceBuffer>[0];

function renderUseSentenceBuffer({
  overrides = {},
}: { overrides?: Partial<UseSentenceBufferOptions> } = {}) {
  const options = { onSentence: vi.fn(), ...overrides };

  return {
    ...renderHook(() => useSentenceBuffer(options)),
    options,
  };
}

describe('useSentenceBuffer', () => {
  it('emits a complete sentence when punctuation is received', () => {
    const { options, result } = renderUseSentenceBuffer();

    result.current.append('Hello world. How are');

    expect(options.onSentence).toHaveBeenCalledTimes(1);
    expect(options.onSentence).toHaveBeenCalledWith('Hello world.');
  });

  it('buffers incomplete text', () => {
    const { options, result } = renderUseSentenceBuffer();

    result.current.append('Hello world');

    expect(options.onSentence).not.toHaveBeenCalled();
  });

  it('emits multiple sentences in one append', () => {
    const { options, result } = renderUseSentenceBuffer();

    result.current.append('First. Second! Third?');

    expect(options.onSentence).toHaveBeenCalledTimes(3);
    expect(options.onSentence).toHaveBeenNthCalledWith(1, 'First.');
    expect(options.onSentence).toHaveBeenNthCalledWith(2, 'Second!');
    expect(options.onSentence).toHaveBeenNthCalledWith(3, 'Third?');
  });

  it('flush emits remaining text', () => {
    const { options, result } = renderUseSentenceBuffer();

    result.current.append('Hello');
    result.current.flush();

    expect(options.onSentence).toHaveBeenCalledTimes(1);
    expect(options.onSentence).toHaveBeenCalledWith('Hello');
  });

  it('does not emit on flush when buffer is empty', () => {
    const { options, result } = renderUseSentenceBuffer();

    result.current.flush();

    expect(options.onSentence).not.toHaveBeenCalled();
  });

  it('carries over remainder across appends', () => {
    const { options, result } = renderUseSentenceBuffer();

    result.current.append('Hello wor');
    result.current.append('ld. Next');

    expect(options.onSentence).toHaveBeenCalledTimes(1);
    expect(options.onSentence).toHaveBeenCalledWith('Hello world.');
  });
});
