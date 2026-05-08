import React from 'react';
import { vi } from 'vitest';

// expo-router — mock navigation hooks
vi.mock('expo-router', () => {
  const mockRouter = {
    back: vi.fn(),
    canGoBack: () => true,
    navigate: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    setParams: vi.fn(),
  };

  return {
    Link: ({
      children,
      ...props
    }: {
      [key: string]: unknown;
      children: React.ReactNode;
    }) => children,
    Redirect: () => null,
    router: mockRouter,
    Slot: ({ children }: { children?: React.ReactNode }) => children || null,
    Stack: { Screen: () => null },
    Tabs: { Screen: () => null },
    useFocusEffect: (cb: () => void) => cb(),
    useGlobalSearchParams: () => ({}),
    useLocalSearchParams: () => ({}),
    useNavigation: () => ({ goBack: vi.fn(), navigate: vi.fn() }),
    usePathname: () => '/',
    useRouter: vi.fn(() => mockRouter),
    useSegments: () => [],
  };
});

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
        get: () => value,
        set: (v: unknown) => {
          value = v;
        },
        get value() {
          return value;
        },
        set value(v: unknown) {
          value = v;
        },
      };
    },
    View: ViewMock,
    withRepeat: (anim: unknown) => anim,
    withSpring: (toValue: unknown) => toValue,
  };
});

// react-native-gesture-handler — mock to prevent global undefined error
vi.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) =>
    children,
  Swipeable: ({ children }: { children: React.ReactNode }) => children,
  TapGestureHandler: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('react-native-gesture-handler/ReanimatedSwipeable', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

// expo-secure-store — mock secret storage
vi.mock('expo-secure-store', () => ({
  deleteItemAsync: vi.fn(() => Promise.resolve()),
  getItemAsync: vi.fn(() => Promise.resolve(null)),
  setItemAsync: vi.fn(() => Promise.resolve()),
}));

// lucide-react-native — render as simple elements for testability
vi.mock('lucide-react-native', () => {
  const createIconMock = (name: string) => {
    const IconMock = () => null;
    IconMock.displayName = `Icon(${name})`;

    return IconMock;
  };

  return {
    ArrowLeft: createIconMock('ArrowLeft'),
    ArrowUp: createIconMock('ArrowUp'),
    Brain: createIconMock('Brain'),
    Check: createIconMock('Check'),
    ChevronLeft: createIconMock('ChevronLeft'),
    ChevronRight: createIconMock('ChevronRight'),
    Eye: createIconMock('Eye'),
    EyeOff: createIconMock('EyeOff'),
    Key: createIconMock('Key'),
    Mic: createIconMock('Mic'),
    Phone: createIconMock('Phone'),
    PhoneOff: createIconMock('PhoneOff'),
    Play: createIconMock('Play'),
    Plus: createIconMock('Plus'),
    Search: createIconMock('Search'),
    Trash2: createIconMock('Trash2'),
    X: createIconMock('X'),
  };
});

// @lobehub/icons-rn — mock AI logos
vi.mock('@lobehub/icons-rn', () => {
  const createIconMock = (name: string) => {
    const IconMock = () => null;
    IconMock.displayName = `Icon(${name})`;

    return IconMock;
  };

  return {
    Anthropic: createIconMock('Anthropic'),
    DeepSeek: createIconMock('DeepSeek'),
    Gemini: createIconMock('Gemini'),
    Gemma: createIconMock('Gemma'),
    Groq: createIconMock('Groq'),
    HuggingFace: createIconMock('HuggingFace'),
    Kimi: createIconMock('Kimi'),
    Meta: createIconMock('Meta'),
    Minimax: createIconMock('Minimax'),
    Ollama: createIconMock('Ollama'),
    OpenAI: createIconMock('OpenAI'),
    OpenCode: createIconMock('OpenCode'),
    Qwen: createIconMock('Qwen'),
    ZAI: createIconMock('ZAI'),
    Zhipu: createIconMock('Zhipu'),
  };
});

// expo-linear-gradient — mock for @lobehub/icons-rn
vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: React.ReactNode }) =>
    children || null,
}));

// react-native-svg — mock for @lobehub/icons-rn
vi.mock('react-native-svg', () => {
  const SvgMock = ({ children }: { children?: React.ReactNode }) =>
    children || null;

  return {
    Circle: SvgMock,
    default: SvgMock,
    Defs: SvgMock,
    G: SvgMock,
    LinearGradient: SvgMock,
    Path: SvgMock,
    Rect: SvgMock,
    Stop: SvgMock,
    Svg: SvgMock,
  };
});

// expo-localization — mock for device locale
vi.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en', regionCode: 'US' }],
}));

// Mock global Expo object if needed by some modules
(globalThis as any).expo = { modules: {} };
(globalThis as any).ExpoModules = {};

// expo-crypto — mock for randomUUID
vi.mock('expo-crypto', () => ({
  randomUUID: () => 'test-uuid-1234',
}));

// expo-file-system — mock for new API
vi.mock('expo-file-system', () => {
  const MockFile = vi.fn().mockImplementation(function (
    this: any,
    ...args: any[]
  ) {
    this.uri = args.join('/');
  });
  MockFile.prototype.text = vi.fn(() => Promise.resolve('{}'));
  MockFile.prototype.write = vi.fn();
  Object.defineProperty(MockFile.prototype, 'exists', {
    configurable: true,
    get: vi.fn(() => true),
  });

  const MockDirectory = vi.fn().mockImplementation(function (
    this: any,
    ...args: any[]
  ) {
    this.uri = args.join('/');
  });
  MockDirectory.prototype.create = vi.fn();
  MockDirectory.prototype.list = vi.fn(() => []);
  Object.defineProperty(MockDirectory.prototype, 'exists', {
    configurable: true,
    get: vi.fn(() => true),
  });

  return {
    Directory: MockDirectory,
    File: MockFile,
    Paths: {
      cache: { uri: 'file:///mock/cache/' },
      document: { uri: 'file:///mock/document/' },
    },
  };
});

// expo-speech — mock TTS module
vi.mock('expo-speech', () => ({
  getAvailableVoicesAsync: vi.fn(() => Promise.resolve([])),
  isSpeakingAsync: vi.fn(() => Promise.resolve(false)),
  speak: vi.fn(),
  stop: vi.fn(),
  VoiceQuality: { Default: 'Default', Enhanced: 'Enhanced' },
}));

// XMLHttpRequest — not available in Node test environment
(globalThis as any).XMLHttpRequest = class MockXMLHttpRequest {
  abort = vi.fn();
  onabort: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onload: (() => void) | null = null;
  onprogress: (() => void) | null = null;
  onreadystatechange: (() => void) | null = null;
  open = vi.fn();
  readyState = 0;
  responseText = '';
  send = vi.fn();
  setRequestHeader = vi.fn();
  status = 0;
} as any;

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

// react-native-executorch — mock on-device ML runtime
vi.mock('react-native-executorch', () => {
  const mockModel = {
    downloadProgress: 1,
    error: null,
    forward: vi.fn(() => Promise.resolve(new Float32Array(384).fill(0.1))),
    isGenerating: false,
    isReady: true,
  };

  return {
    ALL_MINILM_L6_V2: 'all-MiniLM-L6-v2',
    initExecutorch: vi.fn(),
    useTextEmbeddings: vi.fn(() => mockModel),
  };
});

// react-native-executorch-expo-resource-fetcher — mock download adapter
vi.mock('react-native-executorch-expo-resource-fetcher', () => ({
  ExpoResourceFetcher: {
    fetch: vi.fn(() => Promise.resolve({ uri: 'mock://cached-model.pte' })),
  },
}));

// Helper to emit speech recognition events in tests
export function emitSpeechEvent(eventName: string, event: unknown) {
  const listeners = speechListeners.get(eventName) ?? [];
  listeners.forEach((l) => l(event));
}
