import { render, screen } from '@testing-library/react-native';

import {
  ModelDownloadModal,
  type ModelDownloadModalProps,
} from './ModelDownloadModal';

const DEFAULT_PROPS: ModelDownloadModalProps = {
  downloadProgress: 0,
  error: null,
  status: 'initializing',
};

const renderModelDownloadModal = (
  overrides: Partial<ModelDownloadModalProps> = {},
) => {
  const props = { ...DEFAULT_PROPS, ...overrides };

  return render(<ModelDownloadModal {...props} />);
};

describe('ModelDownloadModal', () => {
  it('renders progress bar and percentage when downloading', () => {
    renderModelDownloadModal({
      downloadProgress: 0.45,
      status: 'downloading',
    });

    expect(screen.getByText('45%')).toBeTruthy();
    expect(screen.getByText('Setting Up Soren')).toBeTruthy();
  });

  it('renders initializing state', () => {
    renderModelDownloadModal({
      status: 'initializing',
    });

    expect(screen.getByText('Initializing…')).toBeTruthy();
  });

  it('renders error state with continue button', () => {
    const error = new Error('Network failure');
    renderModelDownloadModal({
      error,
      status: 'error',
    });

    expect(screen.getByText('AI Setup Failed')).toBeTruthy();
    expect(screen.getByText('Network failure')).toBeTruthy();
    expect(screen.getByText('Continue Without AI')).toBeTruthy();
  });

  it('does not render when ready', () => {
    const { toJSON } = renderModelDownloadModal({
      downloadProgress: 1,
      status: 'ready',
    });

    expect(toJSON()).toBeNull();
  });
});
