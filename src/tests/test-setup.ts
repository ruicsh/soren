import React from 'react';
import { vi } from 'vitest';

// expo-router — mock navigation hooks
vi.mock('expo-router', () => ({
  Link: ({
    children,
    ...props
  }: {
    [key: string]: unknown;
    children: React.ReactNode;
  }) => children,
  Redirect: () => null,
  router: {
    back: vi.fn(),
    canGoBack: () => true,
    navigate: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    setParams: vi.fn(),
  },
  Slot: ({ children }: { children?: React.ReactNode }) => children || null,
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
  useFocusEffect: (cb: () => void) => cb(),
  useGlobalSearchParams: () => ({}),
  useLocalSearchParams: () => ({}),
  useNavigation: () => ({ goBack: vi.fn(), navigate: vi.fn() }),
  usePathname: () => '/',
  useRouter: () => ({
    back: vi.fn(),
    canGoBack: () => true,
    navigate: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    setParams: vi.fn(),
  }),
  useSegments: () => [],
}));

// react-native-reanimated — passthrough for tests
vi.mock('react-native-reanimated', () => {
  const ViewMock = React.forwardRef(
    (
      {
        children,
        ...props
      }: { [key: string]: unknown; children?: React.ReactNode },
      ref: React.Ref<unknown>,
    ) => {
      return React.createElement('div', { ref, ...props }, children);
    },
  );
  ViewMock.displayName = 'ReanimatedView';

  return {
    createAnimatedComponent: (Component: React.ElementType) => Component,
    default: {
      createAnimatedComponent: (Component: React.ElementType) => Component,
      View: ViewMock,
    },
    useAnimatedStyle: (getter: () => Record<string, unknown>) => getter(),
    useSharedValue: (initialValue: unknown) => {
      let value = initialValue;
      return {
        get value() {
          return value;
        },
        set value(v: unknown) {
          value = v;
        },
      };
    },
    View: ViewMock,
  };
});

// lucide-react-native — render as simple elements for testability
vi.mock('lucide-react-native', () => {
  const createIconMock = (name: string) => {
    const IconMock = () => null;
    IconMock.displayName = `Icon(${name})`;
    return IconMock;
  };

  return {
    ArrowUp: createIconMock('ArrowUp'),
    Brain: createIconMock('Brain'),
    Mic: createIconMock('Mic'),
  };
});

// expo-speech-recognition — mock module and hook
const speechListeners = new Map<string, ((event: unknown) => void)[]>();

vi.mock('expo-speech-recognition', () => ({
  ExpoSpeechRecognitionModule: {
    abort: vi.fn(),
    requestPermissionsAsync: vi.fn(() =>
      Promise.resolve({
        canAskAgain: true,
        expires: 'never',
        granted: true,
        status: 'granted',
      } as any),
    ),
    start: vi.fn(),
    stop: vi.fn(),
  },
  useSpeechRecognitionEvent: (
    eventName: string,
    listener: (event: unknown) => void,
  ) => {
    React.useEffect(() => {
      const listeners = speechListeners.get(eventName) ?? [];
      listeners.push(listener);
      speechListeners.set(eventName, listeners);
      return () => {
        const updated = speechListeners.get(eventName) ?? [];
        speechListeners.set(
          eventName,
          updated.filter((l) => l !== listener),
        );
      };
    }, [eventName, listener]);
  },
}));

// Helper to emit speech recognition events in tests
export function emitSpeechEvent(eventName: string, event: unknown) {
  const listeners = speechListeners.get(eventName) ?? [];
  listeners.forEach((l) => l(event));
}
