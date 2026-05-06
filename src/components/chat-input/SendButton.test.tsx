import { fireEvent, render, screen } from '@testing-library/react-native';

import { SendButton, type SendButtonProps } from './SendButton';

const DEFAULT_PROPS: SendButtonProps = {
  onPress: vi.fn(),
};

function renderSendButton(overrides: Partial<SendButtonProps> = {}) {
  const props = { ...DEFAULT_PROPS, ...overrides };

  return render(<SendButton {...props} />);
}

describe('SendButton', () => {
  it('renders', () => {
    renderSendButton();
    expect(screen.getByTestId('send-button')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPressSpy = vi.fn();
    renderSendButton({ onPress: onPressSpy });

    fireEvent.press(screen.getByTestId('send-button'));
    expect(onPressSpy).toHaveBeenCalledTimes(1);
  });

  it('renders with testID', () => {
    renderSendButton();
    expect(screen.getByTestId('send-button')).toBeTruthy();
  });
});
