import React from 'react';
import { vi } from 'vitest';

// react-native-css — no CSS compilation in test env, pass components through
vi.mock('react-native-css', () => ({
  useCssElement: (
    Component: React.ElementType,
    props: Record<string, unknown>,
  ) => {
    const { className, contentContainerClassName, contentClassName, ...rest } =
      props as Record<string, unknown>;
    return React.createElement(Component, rest);
  },
  styled: (Component: React.ElementType) => Component,
  cssInterop: (Component: React.ElementType) => Component,
  useNativeVariable: () => ({}),
}));

// nativewind — passthrough wrappers
vi.mock('nativewind', () => ({
  styled: (Component: React.ElementType) => Component,
  cssInterop: (Component: React.ElementType) => Component,
}));

// expo-router — mock navigation hooks
vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    navigate: vi.fn(),
    canGoBack: () => true,
    setParams: vi.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useGlobalSearchParams: () => ({}),
  useSegments: () => [],
  usePathname: () => '/',
  useNavigation: () => ({ navigate: vi.fn(), goBack: vi.fn() }),
  useFocusEffect: (cb: () => void) => cb(),
  Link: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => children,
  Slot: ({ children }: { children?: React.ReactNode }) => children || null,
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
  Redirect: () => null,
  router: {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    navigate: vi.fn(),
    canGoBack: () => true,
    setParams: vi.fn(),
  },
}));

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
  };
});
