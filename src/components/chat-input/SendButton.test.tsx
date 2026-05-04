import { fireEvent, render, screen } from '@testing-library/react-native';

import { SendButton } from './SendButton';

describe('SendButton', () => {
  it('renders', () => {
    render(<SendButton onPress={vi.fn()} />);
    expect(screen.getByTestId('send-button')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPressSpy = vi.fn();
    render(<SendButton onPress={onPressSpy} />);

    fireEvent.press(screen.getByTestId('send-button'));
    expect(onPressSpy).toHaveBeenCalledTimes(1);
  });

  it('renders with testID', () => {
    render(<SendButton onPress={vi.fn()} />);
    expect(screen.getByTestId('send-button')).toBeTruthy();
  });
});
