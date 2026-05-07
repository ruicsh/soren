import { fireEvent, render, screen } from '@testing-library/react-native';
import { vi } from 'vitest';

import VoiceScreen from './voice';

const mockActivate = vi.fn();
const mockDeactivate = vi.fn();
const mockInterrupt = vi.fn();

vi.mock('@/hooks/use-chatbot-config', () => ({
  useChatbotConfig: () => ({
    config: {
      llmModel: 'gpt-4o',
      llmProvider: 'openai',
      name: 'Soren',
      uuid: 'test-uuid',
      voiceId: 'voice-1',
    },
    isLoading: false,
  }),
}));

vi.mock('@/hooks/use-voice-mode', () => ({
  useVoiceMode: () => {
    return {
      activate: mockActivate,
      availableVoices: [],
      deactivate: mockDeactivate,
      error: null,
      interrupt: mockInterrupt,
      messages: [],
      state: (globalThis as any).__VOICE_STATE || 'connecting',
      transcript: '',
    };
  },
}));

describe('VoiceScreen', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (globalThis as any).__VOICE_STATE = 'connecting';
  });

  it('renders connecting state on mount', () => {
    render(<VoiceScreen />);
    expect(screen.getByText('Connecting…')).toBeTruthy();
    expect(screen.getByText('Soren')).toBeTruthy();
    expect(screen.getByText('openai:gpt-4o')).toBeTruthy();
    expect(mockActivate).toHaveBeenCalled();
  });

  it('calls deactivate on disconnect', () => {
    render(<VoiceScreen />);
    const button = screen.getByTestId('call-button');
    fireEvent.press(button);
    expect(mockDeactivate).toHaveBeenCalled();
  });

  it('calls interrupt when interrupt button is pressed', () => {
    (globalThis as any).__VOICE_STATE = 'speaking';
    render(<VoiceScreen />);
    const button = screen.getByTestId('interrupt-button');
    fireEvent.press(button);
    expect(mockInterrupt).toHaveBeenCalled();
  });
});
