import type { NotificationService } from "~~/types/notifications";
import { normalizeSignalUsername } from "~~/utils/notifications/validation";

export type Delivery = { channel: NotificationService; recipient: string };

/** "alice@example.com" → "a***@example.com" (first character of the local part and the domain). */
export const maskEmail = (email: string) => {
  const at = email.lastIndexOf("@");
  const local = at === -1 ? email : email.slice(0, at);
  return `${local.slice(0, 1)}***${at === -1 ? "" : email.slice(at)}`;
};

/** "alice.42" → "al***"; one- or two-character values are hidden entirely. */
export const maskSignalUsername = (username: string) => `${username.length > 2 ? username.slice(0, 2) : ""}***`;

/** "123456789" → "***6789"; ids of four characters or fewer are hidden entirely. */
export const maskChatId = (chatId: string) => `***${chatId.length > 4 ? chatId.slice(-4) : ""}`;

const MASKS: Record<NotificationService, (recipient: string) => string> = {
  email: maskEmail,
  signal: maskSignalUsername,
  telegram: maskChatId,
};

export const maskRecipient = (channel: NotificationService, recipient: string) => MASKS[channel](recipient);

/**
 * Masks every occurrence of the recipients in `text`, e.g. a provider error that echoes the address. A Signal
 * recipient is also masked in the normalized form that sendSignalMessage reports.
 */
export const redactRecipients = (text: string, deliveries: readonly Delivery[]) => {
  const targets: Delivery[] = [];
  for (const delivery of deliveries) {
    targets.push(delivery);
    if (delivery.channel === "signal") {
      targets.push({ channel: "signal", recipient: normalizeSignalUsername(delivery.recipient) });
    }
  }
  // Longest first, so a recipient that contains another is masked whole.
  targets.sort((a, b) => b.recipient.length - a.recipient.length);

  let redacted = text;
  for (const { channel, recipient } of targets) {
    if (recipient) redacted = redacted.split(recipient).join(maskRecipient(channel, recipient));
  }
  return redacted;
};

/** "0x3a3a…3a3a": enough to tell wallets apart in a response without listing them in full. */
export const shortenAddress = (address: string) =>
  address.length > 10 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
