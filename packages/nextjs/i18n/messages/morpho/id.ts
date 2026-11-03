import type { MorphoMessages } from "./shared";
import { idForMarket, idOnMarket, plural } from "~~/i18n/format";

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Peringatan faktor kesehatan Morpho Blue dan Midnight",
    metaDescription: (networkCount, channels) =>
      `Peringatan faktor kesehatan Morpho Blue dan Midnight lewat ${channels}, di ${networkCount} jaringan, plus pengingat jatuh tempo pinjaman bunga tetap.`,
    title: "Posisi Morpho Blue dan Midnight serta peringatan faktor kesehatan",
    intro: networks =>
      `Posisi pinjaman Anda di pasar yang tercantum di aplikasi Morpho, di ${networks}: pinjaman bunga mengambang (Morpho Blue) dan pinjaman bunga tetap (Morpho Midnight). Faktor kesehatan dibaca dari blockchain.`,
    checks: minutes =>
      `Peringatan diperiksa setiap ${minutes} menit. Pinjaman bunga tetap juga mendapat pengingat 7 hari dan 1 hari sebelum jatuh tempo, serta peringatan di setiap pemeriksaan setelah jatuh tempo selama masih ada utang.`,
    access: "Satu pembayaran akses mencakup peringatan Aave dan Morpho Anda.",
    notAffiliated: "Tokenping tidak berafiliasi dengan Morpho.",
    guideHealthFactor: "Cara kerja faktor kesehatan Morpho",
    guideLiquidation: "Cara kerja likuidasi Morpho",
    guideMidnight: "Pinjaman bunga tetap Morpho Midnight",
    aaveDashboard: "Meminjam di Aave? Buka dasbor Aave",
  },
  positionsHeading: "Posisi Morpho Anda",
  gate: {
    title: "Hubungkan dompet untuk melanjutkan",
    description:
      "Tokenping memerlukan alamat dompet Anda untuk menemukan posisi Morpho Anda. Menghubungkan dompet tidak memindahkan dana dan tidak dikenai biaya.",
    connect: "Hubungkan dompet",
    connecting: "Menghubungkan",
    approveInWallet: "Setujui koneksi di dompet Anda.",
  },
  list: {
    heading: "Pasar",
    count: count => `${count} dengan utang`,
    none: "Tidak ditemukan pinjaman di pasar yang tercantum di aplikasi Morpho.",
    discoveryFailed: "API Morpho tidak merespons, jadi hanya pasar dengan peringatan tersimpan yang ditampilkan.",
    variableRate: "Bunga mengambang",
    fixedRate: "Bunga tetap",
    matures: date => `Jatuh tempo ${date}`,
    matured: "Lewat jatuh tempo",
    unreadable: "Tidak dapat dibaca",
    retry: market => `Coba baca ${market} lagi`,
    noneSelectedDescription: "Pilih pasar untuk melihat posisi Morpho-nya.",
  },
  details: {
    collateralValue: "Nilai jaminan",
    debt: "Utang",
    ltv: "LTV",
    lltv: "LTV likuidasi",
    maturity: "Jatuh tempo",
    // Indonesian has no plural: "1 hari lagi", "3 hari lagi".
    timeLeft: (days, hours) =>
      days > 0
        ? plural("id", days, { one: `${days} hari lagi`, other: `${days} hari lagi` })
        : plural("id", hours, { one: `${hours} jam lagi`, other: `${hours} jam lagi` }),
    pastMaturity:
      "Pinjaman ini sudah lewat jatuh tempo: sisa utang dapat dilikuidasi kapan saja, berapa pun faktor kesehatannya. Lunasi untuk menghindari likuidasi.",
    preLiquidation: "Pra-likuidasi",
    preLiquidationNote:
      "Anda memilih ikut pra-likuidasi (pre-liquidation) di pasar ini, jadi faktor kesehatan diukur terhadap batasnya yang lebih awal: di bawah 1, sebagian posisi Anda dapat dijual.",
    amountsIn: token => `Jumlah dalam ${token}, dinilai dengan oracle pasar.`,
    noDebtTitle: "Tidak ada utang di pasar ini",
    noDebtDetail: "Peringatan yang tersimpan tetap tersimpan, dan tidak mengirim apa pun selama tidak ada utang.",
    unreadableTitle: "Posisi ini tidak dapat dibaca",
    unreadableDetail: "Jaringan tidak merespons. Peringatan Anda tetap diperiksa.",
  },
  paywall: {
    descriptionNew: marketName =>
      `Bayar sekali untuk mengatur peringatan faktor kesehatan ${idOnMarket(marketName, "market")} dan pasar lain. Tidak ada yang diperpanjang otomatis: Anda membayar dari dompet saat ingin memperpanjang.`,
    descriptionExtend: marketName =>
      `Pengaturan peringatan Anda yang tersimpan ${idForMarket(marketName, "market")} masih ada di akun Anda. Bayar lagi untuk memperpanjang akses dan mengeditnya.`,
  },
};
