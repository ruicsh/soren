import { fireEvent, render, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { vi } from 'vitest';

import { useChatStream } from '@/hooks/use-chat-stream';
import { useChatbotConfig } from '@/hooks/use-chatbot-config';

import Home from './index';

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
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-07T12:00:00Z')); // Set to today for consistent tests
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);
    vi.mocked(useChatbotConfig).mockReturnValue({
      config: { lastConversationAt: 1714992000000, name: 'Soren' },
      isLoading: false,
    } as any);
    vi.mocked(useChatStream).mockReturnValue({
      isStreaming: false,
      messages: [],
      sendMessage: vi.fn(),
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders chatbot name from config', () => {
    render(<Home />);
    expect(screen.getByText('Soren')).toBeTruthy();
  });

  it('renders last active timestamp if available', () => {
    render(<Home />);
    // 1714992000000 = May 6, 2024 (depending on locale, but checking prefix)
    expect(screen.getByText(/Last active:/)).toBeTruthy();
  });

  it('renders date headers for messages from different days', () => {
    vi.mocked(useChatStream).mockReturnValue({
      isStreaming: false,
      messages: [
        {
          content: 'Hello from yesterday',
          id: 'msg1',
          role: 'user',
          timestamp: new Date('2026-05-06T10:00:00Z').getTime(),
        },
        {
          content: 'Response yesterday',
          id: 'msg2',
          role: 'assistant',
          timestamp: new Date('2026-05-06T10:01:00Z').getTime(),
        },
        {
          content: 'Hello today',
          id: 'msg3',
          role: 'user',
          timestamp: new Date('2026-05-07T10:00:00Z').getTime(),
        },
      ],
      sendMessage: vi.fn(),
    } as any);

    render(<Home />);

    expect(screen.getByText('yesterday')).toBeTruthy();
    expect(screen.getByText('today')).toBeTruthy();
    expect(screen.getByText('Hello from yesterday')).toBeTruthy();
    expect(screen.getByText('Hello today')).toBeTruthy();
  });

  it('navigates to chatbot settings when name is pressed', () => {
    render(<Home />);
    const nameBtn = screen.getByText('Soren');
    fireEvent.press(nameBtn);
    expect(mockPush).toHaveBeenCalledWith('/chatbot-settings');
  });

  it('navigates to voice when phone is pressed', () => {
    render(<Home />);
    const voiceBtn = screen.getByTestId('voice-call-button');
    fireEvent.press(voiceBtn);
    expect(mockPush).toHaveBeenCalledWith('/voice');
  });
});
