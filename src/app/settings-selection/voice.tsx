import * as Localization from 'expo-localization';
import React, { useMemo } from 'react';

import {
  SelectionItem,
  SelectionListScreen,
  SelectionSection,
} from '@/components/settings/SelectionListScreen';
import { useChatbotConfig } from '@/hooks/use-chatbot-config';
import { useTTS } from '@/hooks/use-tts';

// Fallback for test environments where expo-localization might fail to load native modules
const getDeviceLocales = () => {
  try {
    return Localization.getLocales();
  } catch {
    return [{ languageCode: 'en' }];
  }
};

const LANGUAGE_NAMES: Record<string, string> = {
  AR: 'Arabic',
  'AR-SA': 'Saudi Arabian Arabic',
  BG: 'Bulgarian',
  CS: 'Czech',
  DA: 'Danish',
  DE: 'German',
  EL: 'Greek',
  EN: 'English',
  'EN-AU': 'Australian English',
  'EN-GB': 'British English',
  'EN-IE': 'Irish English',
  'EN-IN': 'Indian English',
  'EN-US': 'American English',
  'EN-ZA': 'South African English',
  ES: 'Spanish',
  'ES-ES': 'Castilian Spanish',
  'ES-MX': 'Mexican Spanish',
  'ES-US': 'American Spanish',
  FI: 'Finnish',
  FR: 'French',
  'FR-CA': 'Canadian French',
  HE: 'Hebrew',
  HI: 'Hindi',
  HU: 'Hungarian',
  ID: 'Indonesian',
  IT: 'Italian',
  JA: 'Japanese',
  KO: 'Korean',
  NL: 'Dutch',
  'NL-BE': 'Belgian Dutch',
  NO: 'Norwegian',
  PL: 'Polish',
  PT: 'Portuguese',
  'PT-BR': 'Brazilian Portuguese',
  RO: 'Romanian',
  RU: 'Russian',
  SK: 'Slovak',
  SV: 'Swedish',
  TH: 'Thai',
  TR: 'Turkish',
  ZH: 'Chinese',
  'ZH-CN': 'Mainland Chinese',
  'ZH-HK': 'Hong Kong Chinese',
  'ZH-TW': 'Taiwanese Chinese',
};

const getLanguageName = (code: string) => {
  const upper = code.toUpperCase().replace('_', '-');
  // Check our manual map first for common voice locales
  if (LANGUAGE_NAMES[upper]) return LANGUAGE_NAMES[upper];

  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
    const result = displayNames.of(code);
    if (result && result !== code) return result;
  } catch {}

  return LANGUAGE_NAMES[upper.split('-')[0]] || upper;
};

export default function VoiceSelectionScreen() {
  const { availableVoices, config, saveWithConfig } = useChatbotConfig();
  const { speak } = useTTS();

  const sections = useMemo(() => {
    if (!availableVoices.length) return [];

    const locales = getDeviceLocales();
    const deviceLanguage = locales?.[0]?.languageCode?.toUpperCase() || 'EN';

    const createPreview = (v: (typeof availableVoices)[0]) => {
      const langCode = v.language.split('-')[0];
      const langName = getLanguageName(langCode);
      const accentName = getLanguageName(v.language);

      const description =
        accentName && accentName.toLowerCase() !== langName.toLowerCase()
          ? `${accentName.toLowerCase()} voice`
          : `${langName.toLowerCase()} voice`;

      return () => {
        speak(`Hello, my name is ${v.name}. I am a ${description}.`, {
          voice: v.identifier,
        });
      };
    };

    const recommended: SelectionItem[] = [
      { id: null, label: 'Auto (Default)' },
    ];

    // Add current selection to recommended if not already there
    if (config?.voiceId) {
      const current = availableVoices.find(
        (v) => v.identifier === config.voiceId,
      );
      if (current) {
        const quality =
          current.quality && current.quality !== 'Default'
            ? current.quality
            : '';
        const sublabel = quality
          ? `${current.language} • ${quality}`
          : current.language;

        recommended.push({
          id: current.identifier,
          label: current.name,
          onPreview: createPreview(current),
          sublabel,
        });
      }
    }

    // Group by language
    const groups: Record<string, SelectionItem[]> = {};
    availableVoices.forEach((v) => {
      if (v.identifier === config?.voiceId) return; // Skip if already in recommended

      const langCode = v.language.split('-')[0].toUpperCase();
      if (!groups[langCode]) groups[langCode] = [];

      const quality = v.quality && v.quality !== 'Default' ? v.quality : '';
      const sublabel = quality ? `${v.language} • ${quality}` : v.language;

      groups[langCode].push({
        id: v.identifier,
        label: v.name,
        onPreview: createPreview(v),
        sublabel,
      });
    });

    const result: SelectionSection[] = [
      { data: recommended, title: 'Recommended' },
    ];

    // Add device language section if it has voices (and isn't the only section)
    if (groups[deviceLanguage] && groups[deviceLanguage].length > 0) {
      result.push({
        data: groups[deviceLanguage].sort((a, b) =>
          a.label.localeCompare(b.label),
        ),
        title: `Suggested (${getLanguageName(deviceLanguage)})`,
      });
      delete groups[deviceLanguage];
    }

    Object.keys(groups)
      .sort((a, b) => getLanguageName(a).localeCompare(getLanguageName(b)))
      .forEach((langCode) => {
        result.push({
          data: groups[langCode].sort((a, b) => a.label.localeCompare(b.label)),
          title: getLanguageName(langCode),
        });
      });

    return result;
  }, [availableVoices, config?.voiceId, speak]);

  if (!config) return null;

  return (
    <SelectionListScreen
      onSelect={(id) => saveWithConfig({ voiceId: id })}
      searchable
      sections={sections}
      selectedValue={config.voiceId}
      title="Voice"
    />
  );
}
