import * as SecureStore from 'expo-secure-store';

/**
 * SecureStore keys must only contain alphanumeric characters, ".", "-", and "_".
 */
const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9._-]/g, '_');

const getKeyName = (chatbotUuid: string, providerId: string) => {
  if (!chatbotUuid || !providerId) return null;

  return `byok_key.${sanitize(chatbotUuid)}.${sanitize(providerId)}`;
};

export async function deleteApiKey(
  chatbotUuid: string,
  providerId: string,
): Promise<void> {
  const name = getKeyName(chatbotUuid, providerId);
  if (!name) return;
  try {
    await SecureStore.deleteItemAsync(name);
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('SecureStore.deleteItemAsync failed:', err);
    }
  }
}

export async function getApiKey(
  chatbotUuid: string,
  providerId: string,
): Promise<null | string> {
  const name = getKeyName(chatbotUuid, providerId);
  if (!name) return null;
  try {
    return await SecureStore.getItemAsync(name);
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('SecureStore.getItemAsync failed:', err);
    }

    return null;
  }
}

export async function hasApiKey(
  chatbotUuid: string,
  providerId: string,
): Promise<boolean> {
  const key = await getApiKey(chatbotUuid, providerId);

  return !!key;
}

export async function setApiKey(
  chatbotUuid: string,
  providerId: string,
  key: string,
): Promise<void> {
  const name = getKeyName(chatbotUuid, providerId);
  if (!name || !key) return;
  try {
    await SecureStore.setItemAsync(name, key);
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('SecureStore.setItemAsync failed:', err);
    }
  }
}
