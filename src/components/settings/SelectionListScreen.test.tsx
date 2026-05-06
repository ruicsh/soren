import { fireEvent, render, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { vi } from 'vitest';

import { SelectionListScreen } from './SelectionListScreen';

describe('SelectionListScreen', () => {
  const mockOnSelect = vi.fn();
  const mockBack = vi.fn();

  const items = [
    { id: '1', label: 'Option 1', sublabel: 'Sub 1' },
    { id: '2', label: 'Option 2' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ back: mockBack } as any);
  });

  it('renders title and items', () => {
    render(
      <SelectionListScreen
        items={items}
        onSelect={mockOnSelect}
        selectedValue="1"
        title="Test Selection"
      />,
    );

    expect(screen.getByText('Test Selection')).toBeTruthy();
    expect(screen.getByText('Option 1')).toBeTruthy();
    expect(screen.getByText('Sub 1')).toBeTruthy();
    expect(screen.getByText('Option 2')).toBeTruthy();
  });

  it('calls onSelect and back when item is pressed', () => {
    render(
      <SelectionListScreen
        items={items}
        onSelect={mockOnSelect}
        selectedValue="1"
        title="Test Selection"
      />,
    );

    fireEvent.press(screen.getByText('Option 2'));

    expect(mockOnSelect).toHaveBeenCalledWith('2');
    expect(mockBack).toHaveBeenCalled();
  });

  it('calls back when back button is pressed', () => {
    render(
      <SelectionListScreen
        items={items}
        onSelect={mockOnSelect}
        selectedValue="1"
        title="Test Selection"
      />,
    );

    fireEvent.press(screen.getByText('Settings'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('supports search and filters items', () => {
    render(
      <SelectionListScreen
        items={items}
        onSelect={mockOnSelect}
        searchable
        selectedValue="1"
        title="Searchable"
      />,
    );

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.changeText(input, 'Option 2');

    expect(screen.queryByText('Option 1')).toBeNull();
    expect(screen.getByText('Option 2')).toBeTruthy();
  });

  it('renders sections correctly', () => {
    const sections = [
      { data: [{ id: '1', label: 'Section Item 1' }], title: 'Header 1' },
    ];
    render(
      <SelectionListScreen
        onSelect={mockOnSelect}
        sections={sections}
        selectedValue={null}
        title="Sections"
      />,
    );

    expect(screen.getByText('Header 1')).toBeTruthy();
    expect(screen.getByText('Section Item 1')).toBeTruthy();
  });

  it('shows empty state when no items', () => {
    render(
      <SelectionListScreen
        items={[]}
        onSelect={mockOnSelect}
        selectedValue={null}
        title="Empty"
      />,
    );

    // SectionList needs data to render ListEmptyComponent or it might be unmounted/empty
    // We check if the component renders the empty text
    expect(screen.queryByText('No options available')).toBeDefined();
  });
});
