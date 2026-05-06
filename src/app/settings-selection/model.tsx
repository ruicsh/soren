import React from 'react';

import { SelectionListScreen } from '@/components/settings/SelectionListScreen';
import { useChatbotConfig } from '@/hooks/use-chatbot-config';

export default function ModelSelectionScreen() {
  const { availableModels, config, modelsLoading, updateConfig } =
    useChatbotConfig();

  if (!config) return null;

  const items = availableModels.map((m) => ({
    id: m.id,
    label: m.name,
  }));

  // If models are loading but we have a current one, keep showing current
  if (items.length === 0 && config.llmModel) {
    items.push({ id: config.llmModel, label: config.llmModel });
  }

  return (
    <SelectionListScreen
      isLoading={modelsLoading}
      items={items}
      onSelect={(id) => id && updateConfig({ llmModel: id })}
      selectedValue={config.llmModel}
      title="Model"
    />
  );
}
