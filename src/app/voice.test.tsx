import { fireEvent, render, screen } from '@testing-library/react-native';
import { vi } from 'vitest';

import VoiceScreen from './voice';

const mockActivate = vi.fn();
const mockDeactivate = vi.fn();

vi.mock('@/hooks/use-voice-mode', () => ({
  useVoiceMode: () => ({
    activate: mockActivate,
    deactivate: mockDeactivate,
    error: null,
    messages: [],
    state: 'connecting',
    transcript: '',
  }),
}));

describe('VoiceScreen', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders connecting state on mount', () => {
    render(<VoiceScreen />);
    expect(screen.getByText('Connecting…')).toBeTruthy();
    expect(screen.getByText('Soren')).toBeTruthy();
    expect(mockActivate).toHaveBeenCalled();
  });

  it('calls deactivate on disconnect', () => {
    render(<VoiceScreen />);
    const button = screen.getByTestId('call-button');
    fireEvent.press(button);
    expect(mockDeactivate).toHaveBeenCalled();
  });
});
