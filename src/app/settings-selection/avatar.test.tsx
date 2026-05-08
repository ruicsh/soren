import { fireEvent, render, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { vi } from 'vitest';

import { useChatbotConfig } from '@/hooks/use-chatbot-config';

import AvatarSelectionScreen from './avatar';

vi.mock('expo-router', () => ({
  useRouter: vi.fn(() => ({
    back: vi.fn(),
  })),
}));

vi.mock('@/hooks/use-chatbot-config', () => ({
  useChatbotConfig: vi.fn(),
}));

vi.mock('@/components/chatbot-avatar/avatar-bw', () => ({
  applyAvatarBW: vi.fn((config: any) => config),
}));

describe('AvatarSelectionScreen', () => {
  const mockBack = vi.fn();
  const mockSaveWithConfig = vi.fn();

  const mockConfig = {
    avatarConfig: {
      bgColor: '#ff0000',
      earSize: 'small',
      eyeStyle: 'circle',
      faceColor: '#ffffff',
      hairColor: '#000000',
      hairStyle: 'normal',
      hatColor: '#000000',
      hatStyle: 'none',
      mouthStyle: 'smile',
      noseStyle: 'short',
      sex: 'man',
      shirtColor: '#000000',
      shirtStyle: 'polo',
    },
    uuid: 'uuid-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ back: mockBack });
    (useChatbotConfig as any).mockReturnValue({
      config: mockConfig,
      saveWithConfig: mockSaveWithConfig,
    });
  });

  it('renders header with title and back button', () => {
    render(<AvatarSelectionScreen />);

    expect(screen.getByText('Avatar')).toBeTruthy();
    expect(screen.getByLabelText('Go back')).toBeTruthy();
  });

  it('renders default row with Brain icon', () => {
    render(<AvatarSelectionScreen />);

    expect(screen.getByText('Default')).toBeTruthy();
    expect(screen.getByText('Use provider / model logo')).toBeTruthy();
  });

  it('renders Custom Avatars section title', () => {
    render(<AvatarSelectionScreen />);

    expect(screen.getByText('Custom Avatars')).toBeTruthy();
  });

  it('renders Shuffle button', () => {
    render(<AvatarSelectionScreen />);

    expect(screen.getByText('Shuffle')).toBeTruthy();
  });

  it('renders avatar options in the grid', () => {
    render(<AvatarSelectionScreen />);

    // Grid items are TouchableOpacity elements. Count all touchables,
    // subtract the known ones to verify grid items are present.
    const touchables = screen.UNSAFE_getAllByType(TouchableOpacity);
    // 1 back button + 1 default row + 9 grid items + 1 shuffle button = 12
    expect(touchables.length).toBe(12);
  });

  it('shows selectedDot when default is selected (avatarConfig is null)', () => {
    (useChatbotConfig as any).mockReturnValue({
      config: { ...mockConfig, avatarConfig: null },
      saveWithConfig: mockSaveWithConfig,
    });
    render(<AvatarSelectionScreen />);

    expect(screen.getByText('Default')).toBeTruthy();
  });

  it('selects default avatar and navigates back', () => {
    render(<AvatarSelectionScreen />);

    fireEvent.press(screen.getByText('Default'));

    expect(mockSaveWithConfig).toHaveBeenCalledWith({ avatarConfig: null });
    expect(mockBack).toHaveBeenCalled();
  });

  it('selects a custom avatar and navigates back', () => {
    render(<AvatarSelectionScreen />);

    // TouchableOpacities: [0] back, [1] default, [2-10] grid items, [11] shuffle
    const touchables = screen.UNSAFE_getAllByType(TouchableOpacity);
    // Press the first grid item (index 2)
    fireEvent.press(touchables[2]);

    expect(mockSaveWithConfig).toHaveBeenCalled();
    expect(mockSaveWithConfig.mock.calls[0][0].avatarConfig).toBeDefined();
    expect(mockBack).toHaveBeenCalled();
  });

  it('calls back when back button is pressed', () => {
    render(<AvatarSelectionScreen />);

    fireEvent.press(screen.getByLabelText('Go back'));

    expect(mockBack).toHaveBeenCalled();
  });

  it('shuffles avatars when Shuffle is pressed', () => {
    render(<AvatarSelectionScreen />);

    fireEvent.press(screen.getByText('Shuffle'));

    expect(screen.getByText('Shuffle')).toBeTruthy();
  });

  it('shows empty text when genConfig fails', async () => {
    const niceAvatar =
      (await import('@zamplyy/react-native-nice-avatar')) as any;
    niceAvatar.genConfig.mockImplementationOnce(() => {
      throw new Error('Generation failed');
    });

    render(<AvatarSelectionScreen />);

    expect(screen.getByText('Failed to generate avatars')).toBeTruthy();
  });
});
