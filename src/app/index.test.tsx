import { fireEvent, render, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { vi } from 'vitest';

import Home from './index';
import { useChatbotConfig } from '@/hooks/use-chatbot-config';
import { useChatStream } from '@/hooks/use-chat-stream';

vi.mock('@/hooks/use-chatbot-config', () => ({
  useChatbotConfig: vi.fn(),
}));

vi.mock('@/hooks/use-chat-stream', () => ({
  useChatStream: vi.fn(),
}));

describe('Home', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);
    vi.mocked(useChatbotConfig).mockReturnValue({
      config: { name: 'Soren' },
      isLoading: false,
    } as any);
    vi.mocked(useChatStream).mockReturnValue({
      isStreaming: false,
      messages: [],
      sendMessage: vi.fn(),
    } as any);
  });

  it('renders chatbot name from config', () => {
    render(<Home />);
    expect(screen.getByText('Soren')).toBeTruthy();
  });

  it('navigates to settings when name is pressed', () => {
    render(<Home />);
    const nameBtn = screen.getByText('Soren');
    fireEvent.press(nameBtn);
    expect(mockPush).toHaveBeenCalledWith('/settings');
  });

  it('navigates to voice when phone is pressed', () => {
    render(<Home />);
    const voiceBtn = screen.getByTestId('voice-call-button');
    fireEvent.press(voiceBtn);
    expect(mockPush).toHaveBeenCalledWith('/voice');
  });
});
