import { render, screen, fireEvent } from '@testing-library/react-native';

import { MicButton } from './MicButton';

describe('MicButton', () => {
  it('renders mic icon when idle', () => {
    render(<MicButton isRecording={false} onPress={vi.fn()} />);
    expect(screen.getByTestId('mic-button')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPressSpy = vi.fn();
    render(<MicButton isRecording={false} onPress={onPressSpy} />);

    fireEvent.press(screen.getByTestId('mic-button'));
    expect(onPressSpy).toHaveBeenCalledTimes(1);
  });

  it('uses accent background when recording', () => {
    render(<MicButton isRecording={true} onPress={vi.fn()} />);
    const btn = screen.getByTestId('mic-button');
    const style = btn.props.style;
    // style may be an array; flatten it
    const flattened = Array.isArray(style)
      ? Object.assign({}, ...style)
      : style;
    expect(flattened.backgroundColor).toBe('#007AFF');
  });
});
