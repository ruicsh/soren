import { act, cleanup, render, screen } from '@testing-library/react-native';

import { TypingDots } from './TypingDots';

describe('TypingDots', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('renders 3 dots', () => {
    render(<TypingDots />);
    expect(screen.getByTestId('typing-dot-0')).toBeTruthy();
    expect(screen.getByTestId('typing-dot-1')).toBeTruthy();
    expect(screen.getByTestId('typing-dot-2')).toBeTruthy();
  });

  it('highlights the first dot initially', () => {
    render(<TypingDots />);

    expect(screen.getByTestId('typing-dot-0').props.style.opacity).toBe(1);
    expect(screen.getByTestId('typing-dot-1').props.style.opacity).toBe(0.3);
    expect(screen.getByTestId('typing-dot-2').props.style.opacity).toBe(0.3);
  });

  it('cycles opacity through dots over time', () => {
    render(<TypingDots />);

    // Step 0: dot 0 highlighted
    expect(screen.getByTestId('typing-dot-0').props.style.opacity).toBe(1);

    // Step 1: dot 1 highlighted
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByTestId('typing-dot-0').props.style.opacity).toBe(0.3);
    expect(screen.getByTestId('typing-dot-1').props.style.opacity).toBe(1);
    expect(screen.getByTestId('typing-dot-2').props.style.opacity).toBe(0.3);

    // Step 2: dot 2 highlighted
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByTestId('typing-dot-0').props.style.opacity).toBe(0.3);
    expect(screen.getByTestId('typing-dot-1').props.style.opacity).toBe(0.3);
    expect(screen.getByTestId('typing-dot-2').props.style.opacity).toBe(1);

    // Step 3: all dimmed (no dot matches)
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByTestId('typing-dot-0').props.style.opacity).toBe(0.3);
    expect(screen.getByTestId('typing-dot-1').props.style.opacity).toBe(0.3);
    expect(screen.getByTestId('typing-dot-2').props.style.opacity).toBe(0.3);

    // Step 0 again: back to dot 0
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByTestId('typing-dot-0').props.style.opacity).toBe(1);
    expect(screen.getByTestId('typing-dot-1').props.style.opacity).toBe(0.3);
    expect(screen.getByTestId('typing-dot-2').props.style.opacity).toBe(0.3);
  });

  it('cleans up interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const { unmount } = render(<TypingDots />);

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
