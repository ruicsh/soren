import { fireEvent, render, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import { vi } from 'vitest';

import { useChatbotConfig } from '@/hooks/use-chatbot-config';
import { useTTS } from '@/hooks/use-tts';

import VoiceSelectionScreen from './voice';

vi.mock('expo-localization', () => ({
  getLocales: vi.fn(() => [{ languageCode: 'en' }]),
}));

vi.mock('@/hooks/use-chatbot-config');
vi.mock('@/hooks/use-tts');

describe('VoiceSelectionScreen', () => {
  const mockSaveWithConfig = vi.fn();
  const mockSpeak = vi.fn();
  const mockBack = vi.fn();

  const mockVoices = [
    { identifier: 'v1', language: 'en-US', name: 'Alex', quality: 'Enhanced' },
    {
      identifier: 'v2',
      language: 'en-AU',
      name: 'Matilda',
      quality: 'Default',
    },
    {
      identifier: 'v3',
      language: 'pt-BR',
      name: 'Luciana',
      quality: 'Premium',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ back: mockBack } as any);
    vi.mocked(useChatbotConfig).mockReturnValue({
      availableVoices: mockVoices,
      config: { voiceId: 'v1' },
      saveWithConfig: mockSaveWithConfig,
    } as any);
    vi.mocked(useTTS).mockReturnValue({
      availableVoices: mockVoices,
      isSpeaking: false,
      speak: mockSpeak,
      stop: vi.fn(),
    } as any);
  });

  it('renders sections correctly including Suggested based on locale', () => {
    render(<VoiceSelectionScreen />);

    expect(screen.getByText('Recommended')).toBeTruthy();
    expect(screen.getByText('Suggested (English)')).toBeTruthy();
    expect(screen.getByText('Portuguese')).toBeTruthy();

    // Alex is recommended (selected) and in Suggested (en)
    const alexItems = screen.getAllByText('Alex');
    expect(alexItems.length).toBeGreaterThan(0);
  });

  it('triggers preview with correct script and voice identifier', () => {
    render(<VoiceSelectionScreen />);

    // Matilda is 'v2'. Find the preview button by testID
    const matildaPreviewBtn = screen.getByTestId('preview-v2');
    fireEvent.press(matildaPreviewBtn);

    expect(mockSpeak).toHaveBeenCalledWith(
      'Hello, my name is Matilda. I am a australian english voice.',
      { voice: 'v2' },
    );
  });

  it('filters voices based on search query', () => {
    render(<VoiceSelectionScreen />);

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.changeText(searchInput, 'Luciana');

    expect(screen.queryByText('Alex')).toBeNull();
    expect(screen.getByText('Luciana')).toBeTruthy();
  });

  it('updates config when a voice is selected', () => {
    render(<VoiceSelectionScreen />);

    fireEvent.press(screen.getByText('Luciana'));

    expect(mockSaveWithConfig).toHaveBeenCalledWith({ voiceId: 'v3' });
    expect(mockBack).toHaveBeenCalled();
  });
});
