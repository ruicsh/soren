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
  const expectedKeyName = `byok_key.${uuid}.${provider}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('setApiKey', () => {
    it('sets key in SecureStore with sanitized name', async () => {
      await setApiKey(uuid, provider, key);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        expectedKeyName,
        key,
      );
    });

    it('sanitizes invalid characters in name', async () => {
      await setApiKey('uuid:with:colons', 'provider/slash', key);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'byok_key.uuid_with_colons.provider_slash',
        key,
      );
    });

    it('does nothing if inputs are empty', async () => {
      await setApiKey('', provider, key);
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });
  });

  describe('getApiKey', () => {
    it('returns key from SecureStore', async () => {
      vi.mocked(SecureStore.getItemAsync).mockResolvedValue(key);
      const result = await getApiKey(uuid, provider);
      expect(result).toBe(key);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith(expectedKeyName);
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
    it('deletes key from SecureStore', async () => {
      await deleteApiKey(uuid, provider);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(expectedKeyName);
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
