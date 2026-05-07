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

  it('renders OpenAI icon for deepseek models', () => {
    render(<ChatbotAvatar modelId="deepseek-v4" />);
    expect(screen.getByTestId(/icon-deepseek/)).toBeOnTheScreen();
  });

  it('renders OpenAI icon for opencode-go provider', () => {
    render(<ChatbotAvatar providerId="opencode-go" />);
    expect(screen.getByTestId('icon-opencode-go')).toBeOnTheScreen();
  });

  it('renders Groq icon for groq provider', () => {
    render(<ChatbotAvatar providerId="groq" />);
    expect(screen.getByTestId('icon-groq')).toBeOnTheScreen();
  });

  it('renders OpenAI icon for openai provider', () => {
    render(<ChatbotAvatar providerId="openai" />);
    expect(screen.getByTestId('icon-openai')).toBeOnTheScreen();
  });

  it('renders Gemini icon for google provider', () => {
    render(<ChatbotAvatar providerId="google" />);
    expect(screen.getByTestId('icon-google')).toBeOnTheScreen();
  });

  it('renders OpenAI icon for huggingface provider', () => {
    render(<ChatbotAvatar providerId="huggingface" />);
    expect(screen.getByTestId('icon-huggingface')).toBeOnTheScreen();
  });

  it('renders Brain icon as fallback', () => {
    render(<ChatbotAvatar modelId="unknown" providerId="unknown" />);
    expect(screen.getByTestId('icon-fallback')).toBeOnTheScreen();
  });

  it('wraps icons in a white background View', () => {
    render(<ChatbotAvatar modelId="llama-3.1" />);
    const container = screen.getByTestId('avatar-container');
    expect(container.props.style).toMatchObject({
      backgroundColor: '#ffffff',
    });
  });
});
