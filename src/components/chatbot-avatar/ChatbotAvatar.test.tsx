import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { ChatbotAvatar } from './ChatbotAvatar';

describe('ChatbotAvatar', () => {
  it('renders Ollama icon for llama models', () => {
    render(<ChatbotAvatar modelId="llama-3.1" />);
    expect(screen.getByTestId(/icon-llama/)).toBeOnTheScreen();
  });

  it('renders Anthropic icon for claude models', () => {
    render(<ChatbotAvatar modelId="claude-3-opus" />);
    expect(screen.getByTestId(/icon-claude/)).toBeOnTheScreen();
  });

  it('renders OpenAI icon for openai models', () => {
    render(<ChatbotAvatar modelId="openai/gpt-4o" />);
    expect(screen.getByTestId(/icon-openai/)).toBeOnTheScreen();
  });

  it('renders Gemini icon for gemini models', () => {
    render(<ChatbotAvatar modelId="gemini-1.5-flash" />);
    expect(screen.getByTestId(/icon-gemini/)).toBeOnTheScreen();
  });

  it('renders Gemma icon for gemma models', () => {
    render(<ChatbotAvatar modelId="gemma-2" />);
    expect(screen.getByTestId(/icon-gemma/)).toBeOnTheScreen();
  });

  it('renders Qwen icon for qwen models', () => {
    render(<ChatbotAvatar modelId="qwen-2.5" />);
    expect(screen.getByTestId(/icon-qwen/)).toBeOnTheScreen();
  });

  it('renders ZAI icon for glm models', () => {
    render(<ChatbotAvatar modelId="glm-4" />);
    expect(screen.getByTestId(/icon-glm/)).toBeOnTheScreen();
  });

  it('renders Kimi icon for kimi models', () => {
    render(<ChatbotAvatar modelId="kimi-1.5" />);
    expect(screen.getByTestId(/icon-kimi/)).toBeOnTheScreen();
  });

  it('renders Minimax icon for minimax models', () => {
    render(<ChatbotAvatar modelId="minimax-01" />);
    expect(screen.getByTestId(/icon-minimax/)).toBeOnTheScreen();
  });

  it('renders DeepSeek icon for deepseek models', () => {
    render(<ChatbotAvatar modelId="deepseek-v4" />);
    expect(screen.getByTestId(/icon-deepseek/)).toBeOnTheScreen();
  });

  it('renders Groq icon for groq provider', () => {
    render(<ChatbotAvatar providerId="groq" />);
    expect(screen.getByTestId('icon-groq')).toBeOnTheScreen();
  });

  it('renders OpenAI icon for openai provider', () => {
    render(<ChatbotAvatar providerId="openai" />);
    expect(screen.getByTestId('icon-openai')).toBeOnTheScreen();
  });

  it('renders Anthropic icon for anthropic provider', () => {
    render(<ChatbotAvatar providerId="anthropic" />);
    expect(screen.getByTestId('icon-anthropic')).toBeOnTheScreen();
  });

  it('renders Gemini icon for google provider', () => {
    render(<ChatbotAvatar providerId="google" />);
    expect(screen.getByTestId('icon-google')).toBeOnTheScreen();
  });

  it('renders HuggingFace icon for huggingface provider', () => {
    render(<ChatbotAvatar providerId="huggingface" />);
    expect(screen.getByTestId('icon-huggingface')).toBeOnTheScreen();
  });

  it('renders Brain icon as fallback', () => {
    render(<ChatbotAvatar modelId="unknown" providerId="unknown" />);
    expect(screen.getByTestId('icon-fallback')).toBeOnTheScreen();
  });

  it('renders nice-avatar when avatarConfig is provided', () => {
    render(
      <ChatbotAvatar
        avatarConfig={{ hairStyle: 'normal', sex: 'man' }}
        modelId="llama-3.1"
      />,
    );
    expect(screen.getByTestId('icon-nice-avatar')).toBeOnTheScreen();
  });

  it('falls back to provider icon when avatarConfig is null', () => {
    render(
      <ChatbotAvatar
        avatarConfig={null}
        modelId="llama-3.1"
        providerId="groq"
      />,
    );
    expect(screen.getByTestId('icon-groq')).toBeOnTheScreen();
  });

  it('falls back to provider icon when avatarConfig is undefined', () => {
    render(<ChatbotAvatar modelId="llama-3.1" />);
    expect(screen.getByTestId(/icon-llama/)).toBeOnTheScreen();
  });

  it('wraps icons in a white background View', () => {
    render(<ChatbotAvatar modelId="llama-3.1" />);
    const container = screen.getByTestId('avatar-container');
    expect(container.props.style).toMatchObject({
      backgroundColor: '#ffffff',
    });
  });
});
