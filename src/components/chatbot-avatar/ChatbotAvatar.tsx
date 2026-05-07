import {
  Anthropic,
  DeepSeek,
  Gemini,
  Gemma,
  Groq,
  HuggingFace,
  Kimi,
  Minimax,
  Ollama,
  OpenAI,
  Qwen,
  ZAI,
} from '@lobehub/icons-rn';
import { Brain as IconBrain } from 'lucide-react-native';
import { View } from 'react-native';

export type AvatarProvider =
  | 'anthropic'
  | 'groq'
  | 'meta'
  | 'mistral'
  | 'openai'
  | 'opencode'
  | string;

interface ChatbotAvatarProps {
  modelId?: string;
  providerId?: string;
  size?: number;
}

export const ChatbotAvatar = (props: ChatbotAvatarProps) => {
  const { modelId, providerId, size = 40 } = props;
  let icon = null;

  const mid = modelId?.toLowerCase() || '';
  const iconSize = size * 0.75;

  // Try model specific icons first
  if (mid.includes('llama')) {
    icon = <Ollama size={iconSize} />;
  } else if (mid.includes('claude')) {
    icon = <Anthropic size={iconSize} />;
  } else if (mid.includes('openai') || mid.includes('gpt')) {
    icon = <OpenAI size={iconSize} />;
  } else if (mid.includes('deepseek')) {
    icon = <DeepSeek size={iconSize} />;
  } else if (mid.includes('gemini')) {
    icon = <Gemini size={iconSize} />;
  } else if (mid.includes('gemma')) {
    icon = <Gemma size={iconSize} />;
  } else if (mid.includes('qwen')) {
    icon = <Qwen size={iconSize} />;
  } else if (mid.includes('glm')) {
    icon = <ZAI size={iconSize} />;
  } else if (mid.includes('kimi')) {
    icon = <Kimi size={iconSize} />;
  } else if (mid.includes('minimax')) {
    icon = <Minimax size={iconSize} />;
  } else {
    // Fallback to provider icons
    switch (providerId?.toLowerCase()) {
      case 'anthropic':
        icon = <Anthropic size={iconSize} />;
        break;
      case 'google':
        icon = <Gemini size={iconSize} />;
        break;
      case 'groq':
        icon = <Groq size={iconSize} />;
        break;
      case 'huggingface':
        icon = <HuggingFace size={iconSize} />;
        break;
      case 'ollama':
      case 'ollama-cloud':
        icon = <Ollama size={iconSize} />;
        break;
      case 'openai':
        icon = <OpenAI size={iconSize} />;
        break;
    }
  }

  if (icon) {
    return (
      <View
        style={{
          alignItems: 'center',
          backgroundColor: '#ffffff',
          borderRadius: size * 0.2,
          height: size,
          justifyContent: 'center',
          overflow: 'hidden',
          padding: size * 0.1,
          width: size,
        }}
        testID="avatar-container"
      >
        {icon}
        <View testID={`icon-${providerId || modelId}`} />
      </View>
    );
  }

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: size * 0.2,
        height: size,
        justifyContent: 'center',
        overflow: 'hidden',
        width: size,
      }}
      testID="avatar-container"
    >
      <IconBrain color="#ffffff" size={size * 0.75} />
      <View testID="icon-fallback" />
    </View>
  );
};
