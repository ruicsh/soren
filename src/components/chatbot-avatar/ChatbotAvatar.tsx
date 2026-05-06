import { Anthropic, Groq, Meta, Ollama, OpenAI } from '@lobehub/icons-rn';
import { Brain as IconBrain } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

export type AvatarProvider =
  | 'anthropic'
  | 'groq'
  | 'meta'
  | 'mistral'
  | 'openai'
  | string;

interface ChatbotAvatarProps {
  modelId?: string;
  providerId?: string;
  size?: number;
}

export const ChatbotAvatar = ({
  modelId,
  providerId,
  size = 40,
}: ChatbotAvatarProps) => {
  let icon = null;

  // Try model specific icons first
  if (modelId?.toLowerCase().includes('llama')) {
    icon = <Ollama size={size} />;
  } else if (modelId?.toLowerCase().includes('claude')) {
    icon = <Anthropic size={size} />;
  } else {
    // Fallback to provider icons
    switch (providerId?.toLowerCase()) {
      case 'anthropic':
        icon = <Anthropic size={size} />;
        break;
      case 'groq':
        icon = <Groq size={size} />;
        break;
      case 'ollama':
        icon = <Ollama size={size} />;
        break;
      case 'openai':
        icon = <OpenAI size={size} />;
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
