import * as SecureStore from 'expo-secure-store';
import { vi } from 'vitest';

import { deleteApiKey, getApiKey, hasApiKey, setApiKey } from './byok-keys';

vi.mock('expo-secure-store', () => ({
  deleteItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
}));

describe('byok-keys', () => {
  const uuid = 'uuid-123';
  const provider = 'groq';
  const key = 'sk-test-123';
  const expectedKeyName = `byok_key.${provider}`;
  const expectedLegacyKeyName = `byok_key.${uuid}.${provider}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('setApiKey', () => {
    it('sets key in SecureStore with sanitized provider name', async () => {
      await setApiKey(uuid, provider, key);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        expectedKeyName,
        key,
      );
    });

    it('sanitizes invalid characters in provider name', async () => {
      await setApiKey(uuid, 'provider/slash', key);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'byok_key.provider_slash',
        key,
      );
    });

    it('does nothing if provider is empty', async () => {
      await setApiKey(uuid, '', key);
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });
  });

  describe('getApiKey', () => {
    it('returns key from SecureStore (shared key)', async () => {
      vi.mocked(SecureStore.getItemAsync).mockResolvedValue(key);
      const result = await getApiKey(uuid, provider);
      expect(result).toBe(key);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith(expectedKeyName);
    });

    it('falls back to legacy key and migrates if shared key missing', async () => {
      // First call for shared key returns null
      vi.mocked(SecureStore.getItemAsync).mockResolvedValueOnce(null);
      // Second call for legacy key returns value
      vi.mocked(SecureStore.getItemAsync).mockResolvedValueOnce(key);

      const result = await getApiKey(uuid, provider);

      expect(result).toBe(key);
      // Checked shared key first
      expect(SecureStore.getItemAsync).toHaveBeenNthCalledWith(
        1,
        expectedKeyName,
      );
      // Then checked legacy key
      expect(SecureStore.getItemAsync).toHaveBeenNthCalledWith(
        2,
        expectedLegacyKeyName,
      );
      // Then migrated to shared key
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        expectedKeyName,
        key,
      );
    });

    it('returns null and catches errors', async () => {
      vi.mocked(SecureStore.getItemAsync).mockRejectedValue(
        new Error('SecureStore error'),
      );
      const result = await getApiKey(uuid, provider);
      expect(result).toBeNull();
    });
  });

  describe('deleteApiKey', () => {
    it('deletes both shared and legacy keys', async () => {
      await deleteApiKey(uuid, provider);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(expectedKeyName);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        expectedLegacyKeyName,
      );
    });
  });

  describe('hasApiKey', () => {
    it('returns true if key exists', async () => {
      vi.mocked(SecureStore.getItemAsync).mockResolvedValue(key);
      const result = await hasApiKey(uuid, provider);
      expect(result).toBe(true);
    });

    it('returns false if key missing', async () => {
      vi.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
      const result = await hasApiKey(uuid, provider);
      expect(result).toBe(false);
    });
  });
});
