import { fireEvent, render, screen } from '@testing-library/react-native';

import { MicButton, type MicButtonProps } from './MicButton';

const DEFAULT_PROPS: MicButtonProps = {
  isRecording: false,
  onPress: vi.fn(),
};

function renderMicButton(overrides: Partial<MicButtonProps> = {}) {
  const props = { ...DEFAULT_PROPS, ...overrides };

  return render(<MicButton {...props} />);
}

describe('MicButton', () => {
  it('renders mic icon when idle', () => {
    renderMicButton({ isRecording: false });
    expect(screen.getByTestId('mic-button')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPressSpy = vi.fn();
    renderMicButton({ onPress: onPressSpy });

    fireEvent.press(screen.getByTestId('mic-button'));
    expect(onPressSpy).toHaveBeenCalledTimes(1);
  });

  it('renders when recording', () => {
    renderMicButton({ isRecording: true });
    expect(screen.getByTestId('mic-button')).toBeTruthy();
  });
});
