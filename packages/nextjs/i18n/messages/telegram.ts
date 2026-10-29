import type { Localized } from "~~/i18n/locales";

// The Telegram bot's replies, in the language of the sender's Telegram app (telegramLocale in app/api/telegram/bot.ts).
// The translated replies name the alerts UI label („uživatelské jméno na Telegramu“, "nombre de usuario de Telegram",
// "Telegram यूज़रनेम", „Telegram-Benutzername“, "Tên người dùng Telegram"): keep them in sync with alerts.ts.

type TelegramReplies = {
  privateChatsOnly: string;
  /** /start from an account without a username: there is nothing an alert could name. */
  noUsername: string;
  linkSaveFailed: string;
  /** /start linked `username` to this chat. */
  linked: (username: string) => string;
  unsubscribed: string;
  unsubscribeFailed: string;
  help: string;
  unknownCommand: string;
};

export const TELEGRAM_REPLIES: Localized<TelegramReplies> = {
  en: {
    privateChatsOnly: "Tokenping only supports private chats. Please message the bot directly.",
    noUsername:
      "Your Telegram account has no username yet. Set one in Telegram (Settings, then Username), type it into " +
      "your alert on Tokenping, then send /start here again.",
    linkSaveFailed: "Something went wrong linking this chat. Please send /start again.",
    linked: username =>
      `Linked @${username}. Tokenping alerts that name @${username} will arrive in this chat.\n\n` +
      "Send /stop at any time to stop them.",
    unsubscribed: "Stopped. No more Tokenping alerts will arrive here. Send /start to receive them again.",
    unsubscribeFailed: "Something went wrong while stopping alerts. Please send /stop again.",
    help:
      "Tokenping messages you when your Aave or Morpho health factor drops below a threshold you set in the app.\n\n" +
      "Type your Telegram username into your alert on Tokenping, then send /start here once.\n\n" +
      "Commands:\n" +
      "/start: link this chat to your username\n" +
      "/stop: stop all Tokenping alerts here\n" +
      "/help: show this message",
    unknownCommand: "I only respond to /start, /stop and /help. Manage your alerts in the Tokenping app.",
  },
  cs: {
    privateChatsOnly: "Tokenping funguje jen v soukromých chatech. Napište prosím botovi přímo.",
    noUsername:
      "Váš účet na Telegramu zatím nemá uživatelské jméno. Nastavte si ho v Telegramu (Nastavení, Uživatelské " +
      "jméno), zadejte ho do upozornění na Tokenpingu a potom sem znovu pošlete /start.",
    linkSaveFailed: "Při propojování chatu se něco pokazilo. Pošlete prosím /start znovu.",
    linked: username =>
      `Propojeno: @${username}. Upozornění z Tokenpingu, která uvádějí @${username}, budou chodit sem.\n\n` +
      "Kdykoli je zastavíte příkazem /stop.",
    unsubscribed: "Zastaveno. Další upozornění od Tokenpingu sem nepřijdou. Příkazem /start je znovu zapnete.",
    unsubscribeFailed: "Při zastavování upozornění se něco pokazilo. Pošlete prosím /stop znovu.",
    help:
      "Tokenping vám napíše, když váš health factor na Aave nebo Morpho klesne pod práh, který si nastavíte v aplikaci.\n\n" +
      "Zadejte své uživatelské jméno na Telegramu do upozornění na Tokenpingu a potom sem jednou pošlete /start.\n\n" +
      "Příkazy:\n" +
      "/start: propojit tento chat s vaším uživatelským jménem\n" +
      "/stop: zastavit všechna upozornění od Tokenpingu\n" +
      "/help: zobrazit tuto zprávu",
    unknownCommand: "Reaguji jen na /start, /stop a /help. Svá upozornění spravujte v aplikaci Tokenping.",
  },
  es: {
    privateChatsOnly: "Tokenping solo funciona en chats privados. Escríbele directamente al bot.",
    noUsername:
      "Tu cuenta de Telegram todavía no tiene nombre de usuario (alias). Crea uno en Telegram (Ajustes, luego " +
      "Alias), escríbelo en tu alerta de Tokenping y vuelve a enviar /start aquí.",
    linkSaveFailed: "Algo salió mal al vincular este chat. Vuelve a enviar /start.",
    linked: username =>
      `Vinculado: @${username}. Las alertas de Tokenping que indiquen @${username} llegarán a este chat.\n\n` +
      "Envía /stop en cualquier momento para detenerlas.",
    unsubscribed:
      "Alertas detenidas. No llegarán más alertas de Tokenping aquí. Envía /start para volver a recibirlas.",
    unsubscribeFailed: "Algo salió mal al detener las alertas. Vuelve a enviar /stop.",
    help:
      "Tokenping te escribe cuando tu factor de salud en Aave o Morpho cae por debajo de un umbral que fijas en la aplicación.\n\n" +
      "Escribe tu nombre de usuario de Telegram en tu alerta de Tokenping y luego envía /start aquí una vez.\n\n" +
      "Comandos:\n" +
      "/start: vincular este chat con tu nombre de usuario\n" +
      "/stop: detener aquí todas las alertas de Tokenping\n" +
      "/help: mostrar este mensaje",
    unknownCommand: "Solo respondo a /start, /stop y /help. Gestiona tus alertas en la aplicación de Tokenping.",
  },
  hi: {
    privateChatsOnly: "Tokenping केवल निजी चैट में काम करता है। कृपया बॉट को सीधे संदेश भेजें।",
    noUsername:
      "आपके Telegram खाते में अभी कोई यूज़रनेम नहीं है। Telegram में एक सेट करें (सेटिंग, फिर यूज़रनेम), उसे " +
      "Tokenping पर अपने अलर्ट में लिखें, फिर यहां दोबारा /start भेजें।",
    linkSaveFailed: "इस चैट को लिंक करते समय कुछ गड़बड़ हुई। कृपया /start दोबारा भेजें।",
    linked: username =>
      `@${username} लिंक हो गया। Tokenping के वे अलर्ट, जिनमें @${username} लिखा है, इस चैट में आएंगे।\n\n` +
      "उन्हें रोकने के लिए कभी भी /stop भेजें।",
    unsubscribed: "रोक दिया गया। अब Tokenping के और अलर्ट यहां नहीं आएंगे। उन्हें फिर से पाने के लिए /start भेजें।",
    unsubscribeFailed: "अलर्ट रोकते समय कुछ गड़बड़ हुई। कृपया /stop दोबारा भेजें।",
    help:
      "जब आपका Aave या Morpho हेल्थ फ़ैक्टर ऐप में आपकी तय की हुई सीमा से नीचे गिरता है, तो Tokenping आपको संदेश भेजता है।\n\n" +
      "Tokenping पर अपने अलर्ट में अपना Telegram यूज़रनेम लिखें, फिर यहां एक बार /start भेजें।\n\n" +
      "कमांड:\n" +
      "/start: इस चैट को अपने यूज़रनेम से लिंक करें\n" +
      "/stop: यहां Tokenping के सभी अलर्ट रोकें\n" +
      "/help: यह संदेश दिखाएं",
    unknownCommand: "मैं केवल /start, /stop और /help का जवाब देता हूं। अपने अलर्ट Tokenping ऐप में प्रबंधित करें।",
  },
  de: {
    privateChatsOnly: "Tokenping funktioniert nur in privaten Chats. Schreib dem Bot bitte direkt.",
    noUsername:
      "Dein Telegram-Konto hat noch keinen Benutzernamen. Leg in Telegram einen an (Einstellungen, dann " +
      "Benutzername), trag ihn in deinen Alert bei Tokenping ein und sende dann hier noch einmal /start.",
    linkSaveFailed: "Beim Verknüpfen dieses Chats ist etwas schiefgelaufen. Sende bitte noch einmal /start.",
    linked: username =>
      `Verknüpft: @${username}. Tokenping-Alerts, die @${username} nennen, kommen in diesem Chat an.\n\n` +
      "Sende jederzeit /stop, um sie zu beenden.",
    unsubscribed: "Gestoppt. Hier kommen keine Tokenping-Alerts mehr an. Sende /start, um sie wieder zu erhalten.",
    unsubscribeFailed: "Beim Stoppen der Alerts ist etwas schiefgelaufen. Sende bitte noch einmal /stop.",
    help:
      "Tokenping schreibt dir, wenn dein Health Factor auf Aave oder Morpho unter einen Schwellenwert fällt, den du in der App festlegst.\n\n" +
      "Trag deinen Telegram-Benutzernamen in deinen Alert bei Tokenping ein und sende dann hier einmal /start.\n\n" +
      "Befehle:\n" +
      "/start: diesen Chat mit deinem Benutzernamen verknüpfen\n" +
      "/stop: alle Tokenping-Alerts hier stoppen\n" +
      "/help: diese Nachricht anzeigen",
    unknownCommand: "Ich reagiere nur auf /start, /stop und /help. Verwalte deine Alerts in der Tokenping-App.",
  },
  vi: {
    privateChatsOnly: "Tokenping chỉ hoạt động trong cuộc trò chuyện riêng. Hãy nhắn tin trực tiếp cho bot.",
    noUsername:
      "Tài khoản Telegram của bạn chưa có tên người dùng. Hãy đặt một tên trong Telegram (Cài đặt, rồi Tên người " +
      "dùng), nhập tên đó vào cảnh báo của bạn trên Tokenping, rồi gửi lại /start tại đây.",
    linkSaveFailed: "Đã xảy ra lỗi khi liên kết cuộc trò chuyện này. Hãy gửi lại /start.",
    linked: username =>
      `Đã liên kết @${username}. Các cảnh báo Tokenping ghi @${username} sẽ đến cuộc trò chuyện này.\n\n` +
      "Gửi /stop bất cứ lúc nào để dừng nhận.",
    unsubscribed: "Đã dừng. Sẽ không còn cảnh báo Tokenping nào đến đây nữa. Gửi /start để nhận lại.",
    unsubscribeFailed: "Đã xảy ra lỗi khi dừng cảnh báo. Hãy gửi lại /stop.",
    help:
      "Tokenping nhắn tin cho bạn khi hệ số sức khỏe Aave hoặc Morpho của bạn giảm xuống dưới ngưỡng bạn đặt trong ứng dụng.\n\n" +
      "Nhập tên người dùng Telegram của bạn vào cảnh báo trên Tokenping, rồi gửi /start tại đây một lần.\n\n" +
      "Lệnh:\n" +
      "/start: liên kết cuộc trò chuyện này với tên người dùng của bạn\n" +
      "/stop: dừng mọi cảnh báo Tokenping tại đây\n" +
      "/help: hiện tin nhắn này",
    unknownCommand: "Tôi chỉ phản hồi /start, /stop và /help. Hãy quản lý cảnh báo trong ứng dụng Tokenping.",
  },
};
