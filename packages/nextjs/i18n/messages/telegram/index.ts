import { MESSAGES as cs } from "./cs";
import { MESSAGES as de } from "./de";
import { MESSAGES as en } from "./en";
import { MESSAGES as es } from "./es";
import { MESSAGES as fr } from "./fr";
import { MESSAGES as hi } from "./hi";
import { MESSAGES as it } from "./it";
import { MESSAGES as pl } from "./pl";
import { MESSAGES as pt } from "./pt";
import type { TelegramReplies } from "./shared";
import { MESSAGES as vi } from "./vi";
import type { Localized } from "~~/i18n/locales";

// The Telegram bot's replies, in the language of the sender's Telegram app (telegramLocale in app/api/telegram/bot.ts).
// The translated replies name the alerts UI label („uživatelské jméno na Telegramu“, "nombre de usuario de Telegram",
// "Telegram यूज़रनेम", „Telegram-Benutzername“, "Tên người dùng Telegram", "Nom d'utilisateur Telegram", "Nazwa użytkownika
// Telegram"): keep them in sync with alerts.ts.

export type { TelegramReplies } from "./shared";

export const TELEGRAM_REPLIES: Localized<TelegramReplies> = { en, cs, es, hi, de, vi, fr, pt, it, pl };
