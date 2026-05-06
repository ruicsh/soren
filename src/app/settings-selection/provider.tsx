import React from 'react';

import { SelectionListScreen } from '@/components/settings/SelectionListScreen';
import { useChatbotConfig } from '@/hooks/use-chatbot-config';

export default function ProviderSelectionScreen() {
  const { availableProviders, config, saveWithConfig } = useChatbotConfig();

  if (!config) return null;

  const items = availableProviders.map((p) => ({
    id: p.id,
    label: p.label,
  }));

  return (
    <SelectionListScreen
      items={items}
      onSelect={(id) => id && saveWithConfig({ llmProvider: id })}
      selectedValue={config.llmProvider}
      title="Provider"
    />
  );
}
