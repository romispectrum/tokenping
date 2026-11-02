import type { TelegramReplies } from "./shared";

export const MESSAGES: TelegramReplies = {
  privateChatsOnly: "Tokenping hanya mendukung obrolan pribadi. Silakan kirim pesan langsung ke bot.",
  noUsername:
    "Akun Telegram Anda belum memiliki nama pengguna. Buat di Telegram (Pengaturan, lalu Nama pengguna), ketik di " +
    "peringatan Anda di Tokenping, lalu kirim /start di sini lagi.",
  linkSaveFailed: "Terjadi kesalahan saat menghubungkan obrolan ini. Silakan kirim /start lagi.",
  linked: username =>
    `@${username} terhubung. Peringatan Tokenping yang mencantumkan @${username} akan masuk ke obrolan ini.\n\n` +
    "Kirim /stop kapan saja untuk menghentikannya.",
  unsubscribed:
    "Dihentikan. Tidak ada lagi peringatan Tokenping yang masuk ke sini. Kirim /start untuk menerimanya lagi.",
  unsubscribeFailed: "Terjadi kesalahan saat menghentikan peringatan. Silakan kirim /stop lagi.",
  help:
    "Tokenping mengirim pesan kepada Anda saat faktor kesehatan Aave atau Morpho Anda turun di bawah ambang batas yang Anda atur di aplikasi.\n\n" +
    "Ketik nama pengguna Telegram Anda di peringatan Anda di Tokenping, lalu kirim /start di sini satu kali.\n\n" +
    "Perintah:\n" +
    "/start: hubungkan obrolan ini ke nama pengguna Anda\n" +
    "/stop: hentikan semua peringatan Tokenping di sini\n" +
    "/help: tampilkan pesan ini",
  unknownCommand: "Saya hanya menanggapi /start, /stop dan /help. Kelola peringatan Anda di aplikasi Tokenping.",
};
