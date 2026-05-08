import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { vi } from 'vitest';

import { AppHeader, type AppHeaderProps } from './AppHeader';

const DEFAULT_PROPS: AppHeaderProps = {
  onBack: vi.fn(),
};

function renderAppHeader(overrides: Partial<AppHeaderProps> = {}) {
  return render(<AppHeader {...DEFAULT_PROPS} {...overrides} />);
}

describe('AppHeader', () => {
  describe('variant: title (default)', () => {
    it('renders back button with accessibility label', () => {
      renderAppHeader({ title: 'Test' });

      expect(screen.getByLabelText('Go back')).toBeTruthy();
    });

    it('renders the title text', () => {
      renderAppHeader({ title: 'My Title' });

      expect(screen.getByText('My Title')).toBeTruthy();
    });

    it('calls onBack when back button is pressed', () => {
      const onBack = vi.fn();
      renderAppHeader({ onBack, title: 'Test' });

      fireEvent.press(screen.getByLabelText('Go back'));

      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('renders rightSlot when provided', () => {
      renderAppHeader({
        rightSlot: <Text testID="right-content">Action</Text>,
        title: 'Test',
      });

      expect(screen.getByTestId('right-content')).toBeTruthy();
      expect(screen.getByText('Action')).toBeTruthy();
    });

    it('does not render right slot content when rightSlot is not provided', () => {
      renderAppHeader({ title: 'Test' });

      expect(screen.queryByTestId('right-content')).toBeNull();
    });

    it('applies centerTestID to the title text', () => {
      renderAppHeader({
        centerTestID: 'my-title-id',
        title: 'Test',
      });

      expect(screen.getByTestId('my-title-id')).toBeTruthy();
      expect(screen.getByTestId('my-title-id').type).toBe('Text');
    });
  });

  describe('variant: custom', () => {
    it('renders back button with accessibility label', () => {
      renderAppHeader({ variant: 'custom' });

      expect(screen.getByLabelText('Go back')).toBeTruthy();
    });

    it('renders leftContent when provided', () => {
      renderAppHeader({
        leftContent: <Text testID="left-content">Profile</Text>,
        variant: 'custom',
      });

      expect(screen.getByTestId('left-content')).toBeTruthy();
      expect(screen.getByText('Profile')).toBeTruthy();
    });

    it('renders rightSlot when provided', () => {
      renderAppHeader({
        rightSlot: <Text testID="right-content">Call</Text>,
        variant: 'custom',
      });

      expect(screen.getByTestId('right-content')).toBeTruthy();
      expect(screen.getByText('Call')).toBeTruthy();
    });

    it('calls onBack when back button is pressed', () => {
      const onBack = vi.fn();
      renderAppHeader({ onBack, variant: 'custom' });

      fireEvent.press(screen.getByLabelText('Go back'));

      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('does not render center title', () => {
      renderAppHeader({
        title: 'Should Not Appear',
        variant: 'custom',
      });

      expect(screen.queryByText('Should Not Appear')).toBeNull();
    });

    it('renders complex leftContent with nested views', () => {
      renderAppHeader({
        leftContent: (
          <View testID="nested-content">
            <Text>Name</Text>
            <Text>Subtitle</Text>
          </View>
        ),
        variant: 'custom',
      });

      expect(screen.getByTestId('nested-content')).toBeTruthy();
      expect(screen.getByText('Name')).toBeTruthy();
      expect(screen.getByText('Subtitle')).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('defaults to title variant when no variant specified', () => {
      renderAppHeader({ title: 'Default' });

      expect(screen.getByText('Default')).toBeTruthy();
    });

    it('renders with no optional props', () => {
      renderAppHeader();

      expect(screen.getByLabelText('Go back')).toBeTruthy();
    });
  });

  describe('hideBackButton', () => {
    it('hides the back button in title variant', () => {
      renderAppHeader({ hideBackButton: true, title: 'No Back' });

      expect(screen.queryByLabelText('Go back')).toBeNull();
      expect(screen.getByText('No Back')).toBeTruthy();
    });

    it('hides the back button in custom variant', () => {
      renderAppHeader({
        hideBackButton: true,
        variant: 'custom',
      });

      expect(screen.queryByLabelText('Go back')).toBeNull();
    });

    it('renders without onBack when hideBackButton is true', () => {
      renderAppHeader({ hideBackButton: true, title: 'Fine' });

      expect(screen.getByText('Fine')).toBeTruthy();
    });

    it('still renders rightSlot when back button is hidden', () => {
      renderAppHeader({
        hideBackButton: true,
        rightSlot: <Text testID="right-content">Menu</Text>,
        title: 'Test',
      });

      expect(screen.getByTestId('right-content')).toBeTruthy();
      expect(screen.getByText('Menu')).toBeTruthy();
    });
  });
});
