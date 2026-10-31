import type { ClientMessages } from "~~/i18n/client/messages";
import type { Locale } from "~~/i18n/locales";

// Every page gets its language's messages from its root layout, so the app has nothing to fall back to. Vitest
// aliases this module to fallback.vitest.ts, which serves every language, so component tests render without a layout.
export const fallbackMessages = (locale: Locale): ClientMessages => {
  throw new Error(`No ${locale} messages: render client components inside the language's root layout`);
};
