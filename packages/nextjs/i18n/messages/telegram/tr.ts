import type { TelegramReplies } from "./shared";

export const MESSAGES: TelegramReplies = {
  privateChatsOnly: "Tokenping yalnızca özel sohbetlerde çalışır. Lütfen bota doğrudan yazın.",
  noUsername:
    "Telegram hesabınızın henüz bir kullanıcı adı yok. Telegram'da bir kullanıcı adı belirleyin (Ayarlar, ardından " +
    "Kullanıcı adı), bunu Tokenping'deki uyarınıza yazın ve sonra buraya tekrar /start gönderin.",
  linkSaveFailed: "Bu sohbet bağlanırken bir sorun oluştu. Lütfen tekrar /start gönderin.",
  linked: username =>
    `@${username} bağlandı. @${username} kullanıcı adını içeren Tokenping uyarıları bu sohbete gelecek.\n\n` +
    "Uyarıları durdurmak için istediğiniz zaman /stop gönderin.",
  unsubscribed: "Durduruldu. Buraya artık Tokenping uyarısı gelmeyecek. Yeniden almak için /start gönderin.",
  unsubscribeFailed: "Uyarılar durdurulurken bir sorun oluştu. Lütfen tekrar /stop gönderin.",
  help:
    "Tokenping, Aave veya Morpho sağlık faktörünüz uygulamada belirlediğiniz eşiğin altına düştüğünde size mesaj gönderir.\n\n" +
    "Telegram kullanıcı adınızı Tokenping'deki uyarınıza yazın, ardından buraya bir kez /start gönderin.\n\n" +
    "Komutlar:\n" +
    "/start: bu sohbeti kullanıcı adınıza bağlar\n" +
    "/stop: buradaki tüm Tokenping uyarılarını durdurur\n" +
    "/help: bu mesajı gösterir",
  unknownCommand:
    "Yalnızca /start, /stop ve /help komutlarına yanıt veriyorum. Uyarılarınızı Tokenping uygulamasında yönetin.",
};
