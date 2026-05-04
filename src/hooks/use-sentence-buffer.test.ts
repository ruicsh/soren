import { renderHook } from '@testing-library/react-native';

import { useSentenceBuffer } from './use-sentence-buffer';

describe('useSentenceBuffer', () => {
  it('emits a complete sentence when punctuation is received', () => {
    const onSentence = vi.fn();
    const { result } = renderHook(() => useSentenceBuffer({ onSentence }));

    result.current.append('Hello world. How are');

    expect(onSentence).toHaveBeenCalledTimes(1);
    expect(onSentence).toHaveBeenCalledWith('Hello world.');
  });

  it('buffers incomplete text', () => {
    const onSentence = vi.fn();
    const { result } = renderHook(() => useSentenceBuffer({ onSentence }));

    result.current.append('Hello world');

    expect(onSentence).not.toHaveBeenCalled();
  });

  it('emits multiple sentences in one append', () => {
    const onSentence = vi.fn();
    const { result } = renderHook(() => useSentenceBuffer({ onSentence }));

    result.current.append('First. Second! Third?');

    expect(onSentence).toHaveBeenCalledTimes(3);
    expect(onSentence).toHaveBeenNthCalledWith(1, 'First.');
    expect(onSentence).toHaveBeenNthCalledWith(2, 'Second!');
    expect(onSentence).toHaveBeenNthCalledWith(3, 'Third?');
  });

  it('flush emits remaining text', () => {
    const onSentence = vi.fn();
    const { result } = renderHook(() => useSentenceBuffer({ onSentence }));

    result.current.append('Hello');
    result.current.flush();

    expect(onSentence).toHaveBeenCalledTimes(1);
    expect(onSentence).toHaveBeenCalledWith('Hello');
  });

  it('does not emit on flush when buffer is empty', () => {
    const onSentence = vi.fn();
    const { result } = renderHook(() => useSentenceBuffer({ onSentence }));

    result.current.flush();

    expect(onSentence).not.toHaveBeenCalled();
  });

  it('carries over remainder across appends', () => {
    const onSentence = vi.fn();
    const { result } = renderHook(() => useSentenceBuffer({ onSentence }));

    result.current.append('Hello wor');
    result.current.append('ld. Next');

    expect(onSentence).toHaveBeenCalledTimes(1);
    expect(onSentence).toHaveBeenCalledWith('Hello world.');
  });
});
