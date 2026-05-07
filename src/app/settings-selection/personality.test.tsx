import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { vi } from 'vitest';

import { useChatbotConfig } from '@/hooks/use-chatbot-config';
import { useDictation } from '@/hooks/use-dictation';
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/chatbot-config';

import PersonalitySelectionScreen from './personality';

vi.mock('expo-router', () => ({
  useRouter: vi.fn(() => ({
    back: vi.fn(),
  })),
}));

vi.mock('@/hooks/use-chatbot-config', () => ({
  useChatbotConfig: vi.fn(),
}));

vi.mock('@/hooks/use-dictation', () => ({
  useDictation: vi.fn(),
}));

describe('PersonalitySelectionScreen', () => {
  const mockBack = vi.fn();
  const mockSaveWithConfig = vi.fn();
  const mockStartDictation = vi.fn();
  const mockStopDictation = vi.fn();

  const mockConfig = {
    systemPrompt: 'Original Persona',
    uuid: 'uuid-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ back: mockBack });
    (useChatbotConfig as any).mockReturnValue({
      config: mockConfig,
      saveWithConfig: mockSaveWithConfig,
    });
    (useDictation as any).mockReturnValue({
      isRecording: false,
      startDictation: mockStartDictation,
      stopDictation: mockStopDictation,
      transcript: '',
    });
  });

  it('renders original persona from config', () => {
    render(<PersonalitySelectionScreen />);
    expect(screen.getByDisplayValue('Original Persona')).toBeTruthy();
  });

  it('saves and goes back when back button is pressed', async () => {
    render(<PersonalitySelectionScreen />);
    const input = screen.getByDisplayValue('Original Persona');
    fireEvent.changeText(input, 'New Persona');

    const backBtn = screen.getByText('Settings');
    await act(async () => {
      fireEvent.press(backBtn);
    });

    expect(mockSaveWithConfig).toHaveBeenCalledWith({
      systemPrompt: 'New Persona',
    });
    expect(mockBack).toHaveBeenCalled();
  });

  it('uses default prompt if cleared', async () => {
    render(<PersonalitySelectionScreen />);
    const input = screen.getByDisplayValue('Original Persona');
    fireEvent.changeText(input, '   '); // Spaces should be trimmed to empty

    const backBtn = screen.getByText('Settings');
    await act(async () => {
      fireEvent.press(backBtn);
    });

    expect(mockSaveWithConfig).toHaveBeenCalledWith({
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
    });
  });

  it('toggles dictation when mic is pressed', () => {
    render(<PersonalitySelectionScreen />);
    const micBtn = screen.getByTestId('mic-button');

    fireEvent.press(micBtn);
    expect(mockStartDictation).toHaveBeenCalled();

    (useDictation as any).mockReturnValue({
      isRecording: true,
      startDictation: mockStartDictation,
      stopDictation: mockStopDictation,
      transcript: '',
    });

    render(<PersonalitySelectionScreen />);
    const activeMicBtn = screen.getAllByTestId('mic-button')[0];
    fireEvent.press(activeMicBtn);
    expect(mockStopDictation).toHaveBeenCalled();
  });

  it('appends dictation transcript to draft', async () => {
    const { rerender } = render(<PersonalitySelectionScreen />);

    (useDictation as any).mockReturnValue({
      isRecording: true,
      startDictation: mockStartDictation,
      stopDictation: mockStopDictation,
      transcript: 'more text',
    });

    rerender(<PersonalitySelectionScreen />);

    expect(screen.getByDisplayValue('Original Persona more text')).toBeTruthy();
  });
});
