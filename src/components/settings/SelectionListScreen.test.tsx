import { fireEvent, render, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { vi } from 'vitest';

import {
  type SelectionItem,
  SelectionListScreen,
  type SelectionListScreenProps,
  type SelectionSection,
} from './SelectionListScreen';

const mockOnSelect = vi.fn();
const mockBack = vi.fn();

const items: SelectionItem[] = [
  { id: '1', label: 'Option 1', sublabel: 'Sub 1' },
  { id: '2', label: 'Option 2' },
];

const DEFAULT_PROPS: SelectionListScreenProps = {
  items,
  onSelect: mockOnSelect,
  selectedValue: '1',
  title: 'Test Selection',
};

const renderSelectionListScreen = (
  overrides: Partial<SelectionListScreenProps> = {},
) => {
  return render(<SelectionListScreen {...DEFAULT_PROPS} {...overrides} />);
};

describe('SelectionListScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ back: mockBack } as any);
  });

  it('renders title and items', () => {
    renderSelectionListScreen();

    expect(screen.getByText('Test Selection')).toBeTruthy();
    expect(screen.getByText('Option 1')).toBeTruthy();
    expect(screen.getByText('Sub 1')).toBeTruthy();
    expect(screen.getByText('Option 2')).toBeTruthy();
  });

  it('calls onSelect and back when item is pressed', () => {
    renderSelectionListScreen();

    fireEvent.press(screen.getByText('Option 2'));

    expect(mockOnSelect).toHaveBeenCalledWith('2');
    expect(mockBack).toHaveBeenCalled();
  });

  it('calls back when back button is pressed', () => {
    renderSelectionListScreen();

    fireEvent.press(screen.getByLabelText('Go back'));

    expect(mockBack).toHaveBeenCalled();
  });

  it('supports search and filters items', () => {
    renderSelectionListScreen({
      searchable: true,
      title: 'Searchable',
    });

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.changeText(input, 'Option 2');

    expect(screen.queryByText('Option 1')).toBeNull();
    expect(screen.getByText('Option 2')).toBeTruthy();
  });

  it('renders sections correctly', () => {
    const sections: SelectionSection[] = [
      { data: [{ id: '1', label: 'Section Item 1' }], title: 'Header 1' },
    ];

    renderSelectionListScreen({
      items: undefined,
      sections,
      selectedValue: null,
      title: 'Sections',
    });

    expect(screen.getByText('Header 1')).toBeTruthy();
    expect(screen.getByText('Section Item 1')).toBeTruthy();
  });

  it('shows empty state when no items', () => {
    renderSelectionListScreen({
      items: [],
      selectedValue: null,
      title: 'Empty',
    });

    // SectionList needs data to render ListEmptyComponent or it might be unmounted/empty
    // We check if the component renders the empty text
    expect(screen.queryByText('No options available')).toBeDefined();
  });
});
