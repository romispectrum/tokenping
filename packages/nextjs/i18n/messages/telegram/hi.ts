import type { TelegramReplies } from "./shared";

export const MESSAGES: TelegramReplies = {
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
};
