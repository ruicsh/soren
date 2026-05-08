import { fireEvent, render, screen } from '@testing-library/react-native';
import { vi } from 'vitest';

import { BackButton, type BackButtonProps } from './BackButton';

const DEFAULT_PROPS: BackButtonProps = {
  onPress: vi.fn(),
};

function renderBackButton(overrides: Partial<BackButtonProps> = {}) {
  return render(<BackButton {...DEFAULT_PROPS} {...overrides} />);
}

describe('BackButton', () => {
  it('renders with correct accessibility label', () => {
    renderBackButton();

    expect(screen.getByLabelText('Go back')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = vi.fn();
    renderBackButton({ onPress });

    fireEvent.press(screen.getByLabelText('Go back'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('applies the optional style prop', () => {
    const testStyle = { marginRight: 16 };
    renderBackButton({ style: testStyle });

    const button = screen.getByLabelText('Go back');
    expect(button).toHaveStyle(testStyle);
  });

  it('sets hitSlop on the touchable', () => {
    renderBackButton();

    const button = screen.getByLabelText('Go back');
    expect(button.props.hitSlop).toEqual({
      bottom: 8,
      left: 8,
      right: 8,
      top: 8,
    });
  });

  it('does not call onPress when not pressed', () => {
    const onPress = vi.fn();
    renderBackButton({ onPress });

    expect(onPress).not.toHaveBeenCalled();
  });
});
