import type { AlertsMessages } from "./shared";
import { idForMarket, idOnMarket, plural } from "~~/i18n/format";

const ATTRIBUTION_QUESTION = "Dari mana Anda mengetahui Tokenping?";

// The channel's name comes from serviceNames, where email is the badge "Email"; inside a sentence it is "email".
const channelInSentence = (channel: string) => (channel === "Email" ? "email" : channel);

export const MESSAGES: AlertsMessages = {
  cardTitle: "Pengaturan peringatan",
  active: "Aktif",
  payToEdit: "Bayar akses untuk mengedit",
  editAlert: "Edit peringatan",
  signInTitle: "Masuk untuk mengelola peringatan Anda",
  signInDescription:
    "Dompet Anda menandatangani pesan yang membuktikan bahwa alamat ini milik Anda. Ini bukan transaksi dan tidak memakan gas.",
  signIn: "Masuk dengan dompet",
  signingIn: "Menunggu dompet Anda",
  signInStatement: "Masuk ke Tokenping untuk melihat dan mengedit peringatan faktor kesehatan Anda.",
  signInRejected: "Anda menolak permintaan tanda tangan. Masuk untuk melihat dan mengedit peringatan Anda.",
  signInFailed: "Gagal masuk. Coba lagi.",
  signInExpired: "Sesi masuk Anda telah berakhir. Masuk lagi dengan dompet Anda.",
  emptyTitle: (chainName, kind) => `Belum ada peringatan ${idOnMarket(chainName, kind)}`,
  emptyDescription: "Terima pesan saat faktor kesehatan Anda turun di bawah ambang batas pilihan Anda.",
  createAlert: "Buat peringatan",
  loadErrorTitle: "Pengaturan peringatan gagal dimuat",
  loadErrorDescription: "Periksa koneksi Anda dan coba lagi.",
  tryAgain: "Coba lagi",
  retrying: "Mencoba lagi",
  servicesLegend: "Saluran peringatan",
  servicesDescription: "Pilih ke mana peringatan dikirim. Anda dapat memilih lebih dari satu.",
  serviceNames: { email: "Email", signal: "Signal", telegram: "Telegram" },
  emailLabel: "Alamat email",
  emailDescription: "Peringatan dikirim ke alamat ini.",
  emailPlaceholder: "anda@example.com",
  signalLabel: "Nama pengguna Signal",
  signalDescription: "Di Signal, buka Pengaturan, lalu Profil. Bentuknya seperti alice.42.",
  telegramLabel: "Nama pengguna Telegram",
  telegramDescription:
    "Peringatan dikirim ke akun Telegram ini. Temukan di Telegram pada Pengaturan, lalu Nama pengguna.",
  telegramPlaceholder: "alice_eth",
  telegramChecking: "Memeriksa",
  telegramLinked: username => `@${username} terhubung: peringatan akan masuk ke obrolan Telegram Anda.`,
  telegramPressStart: bot => `Belum terhubung: tekan Start di ${bot ? `@${bot}` : "bot Tokenping"} satu kali.`,
  openBot: bot => `Buka @${bot}`,
  telegramStatusUnknown: "Tidak dapat memeriksa apakah nama pengguna ini terhubung. Anda tetap dapat menyimpan.",
  opensInNewTab: "(terbuka di tab baru)",
  channelLanguageLabels: { email: "Bahasa email", signal: "Bahasa Signal", telegram: "Bahasa Telegram" },
  thresholdLabel: "Ambang batas faktor kesehatan",
  thresholdExactValue: "(nilai persis)",
  thresholdScale: { critical: "Kritis", safe: "Aman", verySafe: "Sangat aman" },
  thresholdDescription: (threshold, chainName, kind) =>
    `Anda akan diberi tahu saat faktor kesehatan Anda ${idOnMarket(chainName, kind)} turun di bawah ${threshold}.`,
  saveAlert: "Simpan peringatan",
  saving: "Menyimpan",
  cancel: "Batal",
  deleteAlert: "Hapus peringatan",
  deleting: "Menghapus",
  keepAlert: "Pertahankan peringatan",
  deleteTitle: "Hapus peringatan ini?",
  deleteDescription: (chainName, kind) =>
    `Tokenping berhenti mengirim peringatan faktor kesehatan ${idForMarket(chainName, kind)}.`,
  // Indonesian has no plural: both forms read the same.
  errorSummaryTitle: count =>
    plural("id", count, {
      one: `Perbaiki ${count} kolom untuk menyimpan`,
      other: `Perbaiki ${count} kolom untuk menyimpan`,
    }),
  formErrors: {
    noService: "Pilih setidaknya satu saluran peringatan.",
    noEmail: "Masukkan alamat email Anda.",
    invalidEmail: "Masukkan alamat email seperti nama@example.com.",
    noSignal: "Masukkan nama pengguna Signal Anda.",
    invalidSignal:
      "Masukkan nama pengguna Signal seperti alice.42. Temukan milik Anda di Signal pada Pengaturan, lalu Profil.",
    noTelegram: "Masukkan nama pengguna Telegram Anda.",
    invalidTelegram:
      "Masukkan nama pengguna Telegram seperti alice_eth: 4 hingga 32 huruf, angka atau garis bawah, diawali huruf dan tidak diakhiri _.",
  },
  summaryServices: "Saluran",
  summaryNoServices: "Belum dipilih",
  summaryEmail: "Email",
  summarySignal: "Signal",
  summaryTelegram: "Telegram",
  summaryLanguage: "Bahasa",
  summaryTelegramNotLinked: bot => `Belum terhubung: tekan Start di @${bot} satu kali.`,
  summaryThreshold: "Ambang batas",
  sendTest: "Kirim tes",
  sendingTest: "Mengirim",
  testAgainIn: minutes => `Lagi dalam ${minutes} mnt`,
  testSent: channel => `Pesan tes terkirim lewat ${channelInSentence(channel)}. Periksa apakah sudah sampai.`,
  testFailed: "Pesan tes tidak terkirim",
  testLimitNote: minutes =>
    `Tes mengirim peringatan ini dan posisi Anda seperti saat ini. Satu kali per saluran setiap ${minutes} menit.`,
  belowThresholdTitle: "Di bawah ambang batas peringatan Anda",
  belowThresholdDescription: (healthFactor, threshold) =>
    `Faktor kesehatan Anda saat ini (${healthFactor}) berada di bawah ambang batas Anda, ${threshold}.`,
  alertSaved: "Peringatan disimpan",
  saveFailed: "Gagal menyimpan peringatan Anda",
  alertDeleted: "Peringatan dihapus",
  deleteFailed: "Gagal menghapus peringatan Anda",
  attributionQuestion: ATTRIBUTION_QUESTION,
  attributionFormLabel: `${ATTRIBUTION_QUESTION} (opsional)`,
  attributionDescription: "Membantu kami mengetahui saluran mana yang berhasil. Disimpan bersama alamat dompet Anda.",
  attributionEmpty: "Masukkan jawaban, atau pilih Lewati.",
  // The checks behind it (length, hidden control characters) only fail for pasted text.
  attributionInvalid: () => "Jawaban terlalu panjang atau berisi karakter tersembunyi. Ketik ulang lalu coba lagi.",
  attributionSendFailed: "Gagal mengirim jawaban Anda. Coba lagi atau lewati.",
  sendAnswer: "Kirim jawaban",
  sending: "Mengirim",
  skip: "Lewati",
  answerSent: "Jawaban terkirim",
};
