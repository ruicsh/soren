import React from 'react';

import { SelectionListScreen } from '@/components/settings/SelectionListScreen';
import { useChatbotConfig } from '@/hooks/use-chatbot-config';

export default function VoiceSelectionScreen() {
  const { availableVoices, config, updateConfig } = useChatbotConfig();

  if (!config) return null;

  const items = [
    { id: null, label: 'Auto (Default)' },
    ...availableVoices.map((v) => ({
      id: v.identifier,
      label: v.name,
      sublabel: v.language,
    })),
  ];

  return (
    <SelectionListScreen
      items={items}
      onSelect={(id) => updateConfig({ voiceId: id })}
      selectedValue={config.voiceId}
      title="Voice"
    />
  );
}
