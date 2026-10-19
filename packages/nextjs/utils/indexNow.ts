// IndexNow (https://www.indexnow.org/documentation): tells Bing, Seznam, Yandex and the other participating search
// engines which URLs changed. The key is public by design; it proves that whoever submits URLs for the host also
// controls the host, because the engines fetch the key file from it.

/**
 * Where app/indexnow-key.txt/route.ts serves the key. Submissions name it in keyLocation. It sits at the site root
 * because a key file inside a folder only covers the URLs under that folder.
 */
export const INDEXNOW_KEY_PATH = "/indexnow-key.txt";

/** The protocol's key format: 8 to 128 letters, digits or dashes. */
export const isIndexNowKey = (value: string) => /^[A-Za-z0-9-]{8,128}$/.test(value);

/** The key in INDEXNOW_KEY, or undefined when it is unset or not a valid key. */
export const indexNowKey = (value = process.env.INDEXNOW_KEY) => {
  const key = value?.trim();
  return key && isIndexNowKey(key) ? key : undefined;
};
