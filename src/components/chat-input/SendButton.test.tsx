import { render, screen, fireEvent } from '@testing-library/react-native';

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

  it('uses accent background', () => {
    render(<SendButton onPress={vi.fn()} />);
    const btn = screen.getByTestId('send-button');
    const style = btn.props.style;
    const flattened = Array.isArray(style)
      ? Object.assign({}, ...style)
      : style;
    expect(flattened.backgroundColor).toBe('#007AFF');
  });
});
