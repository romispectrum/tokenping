import { type HomeMessages, rich } from "./shared";
import { capitalize, formatDecimal } from "~~/i18n/format";
import type { AlertPlan } from "~~/services/marketing/alertPlan";

// The alert price ("3 USDC per 30 hari" or the blog's fallback) always follows "Peringatan dikenai biaya" or
// starts a row on its own.

/** "3 USDC per 30 hari": Indonesian has no plural. */
const idPrice = (plan: AlertPlan) => `${formatDecimal("id", plan.priceLabel)} per ${plan.days} hari`;

/** "di jaringan Arbitrum One", or the payment network unnamed. */
const idOnChain = (chainName: string | undefined) =>
  chainName ? `di jaringan ${chainName}` : "di jaringan pembayaran";

export const MESSAGES: HomeMessages = {
  headline: channels => `Peringatan faktor kesehatan Aave dan Morpho lewat ${channels}`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `Peringatan ${channels} saat faktor kesehatan Aave atau Morpho Anda di bawah ambang batas, di ${networks} jaringan, setiap ${minutes} menit.`
      : `Peringatan ${channels} saat faktor kesehatan Aave atau Morpho Anda turun di bawah ambang batas, di ${networks} jaringan. Diperiksa setiap ${minutes} menit.`,
  channelBadge: capitalize,
  pricingCta: plan => (plan ? `Atur peringatan: ${idPrice(plan)}` : "Atur peringatan"),
  offerDescription: ({ days, currency }) =>
    `Peringatan faktor kesehatan selama ${days} hari, dibayar dalam ${currency} dari dompet Anda. Tanpa perpanjangan otomatis.`,

  kicker: "Aave V3 dan V4, Morpho Blue dan Midnight",
  heroLead: ({ minutes, channels }) =>
    `Diperiksa setiap ${minutes} menit. Pesan lewat ${channels} selama Anda di bawah batas Anda. Hanya baca, tanpa persetujuan token.`,
  networksLabel: "Jaringan",
  heroCoverage: networks => `${networks} jaringan`,
  channelsLabel: "Peringatan lewat:",
  exampleAlertLabel: "Isi sebuah peringatan",
  exampleAlertCaption: subject => `Contoh. Email masuk dengan subjek “${subject}”.`,

  dashboardCta: "Buka dasbor Aave",
  morphoDashboardCta: "Buka dasbor Morpho",
  dashboardCtaMicrocopy: alertPrice => `Hubungkan dompet, lihat setiap posisi. Peringatan dikenai biaya ${alertPrice}.`,

  problemTitle: "Faktor kesehatan turun saat Anda tidur",
  problemLead:
    "Aave menampilkan faktor kesehatan Anda tetapi tidak mengirim peringatan (Oktober 2026). Tiga hal mengubahnya dalam semalam:",
  problemCauses: [
    { title: "Harga turun", body: "ETH turun dan nilai jaminan Anda berkurang." },
    { title: "Bunga bertambah", body: "Utang Anda bertambah setiap detik." },
    { title: "Ambang batas berubah", body: "Di Aave, governance dapat menurunkan ambang likuidasi." },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Para peminjam menceritakan ",
      morning("bangun dan mendapati posisinya sudah dilikuidasi"),
      ", ",
      failedRepays("satu jam transaksi pelunasan yang terus gagal"),
      " dan ",
      polygon("pelunasan di 1,01 yang terlambat"),
      ".",
    ),
  problemLiquidator: guide =>
    rich(
      "Likuidator juga mendapat bonus: 5% untuk WETH di pasar Ethereum Core (Oktober 2026).",
      guide && rich(" Baca ", guide("cara kerja likuidasi"), "."),
    ),
  chart: {
    threshold: "ambang batas Anda",
    liquidation: "likuidasi",
    alertSent: "Peringatan terkirim",
    youCheck: "Anda memeriksa ponsel",
    caption:
      "Contoh satu malam. Peringatan terkirim pukul 03:05, pada pemeriksaan pertama di bawah 1,5, lima jam sebelum Anda melihat ponsel.",
  },

  howItWorksTitle: "Cara kerjanya",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? ` di jaringan ${paymentChain}` : "";
    return [
      {
        title: "Hubungkan dompet yang Anda gunakan untuk meminjam",
        body: "Hanya baca. Aave dan Morpho, masing-masing satu halaman.",
      },
      {
        title: plan
          ? `Buka peringatan seharga ${formatDecimal("id", plan.priceLabel)}`
          : "Buka peringatan dengan pembayaran kecil dalam USDC",
        body: `${plan ? `${plan.days} hari, dibayar` : "Dibayar"} dalam USDC${paidOn}. Tanpa perpanjangan otomatis.`,
      },
      {
        title: "Pilih batas untuk setiap pasar",
        body: `Dari ${formatDecimal("id", threshold.min)} (${formatDecimal("id", morphoMin)} di Morpho) hingga ${formatDecimal("id", threshold.max)}, bawaan ${formatDecimal("id", threshold.default)}.`,
      },
      {
        title: "Terima pesan selama Anda di bawahnya",
        body: `Setiap ${minutes} menit, lewat ${channels}, sampai Anda kembali di atas batas Anda.`,
      },
    ];
  },
  scaleTitle: "Di mana menaruh batas Anda",
  scale: {
    liquidation: "likuidasi",
    critical: "Kritis",
    risky: "Berisiko",
    safe: "Aman",
    defaultThreshold: value => `Bawaan ${value}`,
    below: value => `Di bawah ${value}`,
    between: (from, to) => `${from} hingga ${to}`,
    andAbove: value => `${value} ke atas`,
    range: (min, max) => `Nilai berapa pun dari ${min} hingga ${max}.`,
  },
  scaleGuide: "Cara memilih ambang batas",

  coverageTitle: "Setiap pasar Aave dan setiap pasar Morpho yang tercantum",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `${v3Markets} pasar Aave V3 di ${v3Networks} jaringan dan ${spokes} Spoke Aave V4 di ${v4Networks} jaringan, per 4 November 2026, ditambah setiap pasar Morpho yang tercantum di ${morphoNetworks} jaringan.`,
  coverage: {
    v3Markets: count => `${count} pasar V3`,
    v4Spokes: count => `${count} Spoke V4`,
    morpho: "Morpho",
  },
  coverageNote:
    "Scroll, ZKsync, Metis, Soneium dan Sonic sedang dihentikan bertahap oleh governance Aave dan masih dipantau. Tidak dicakup: Aave V3 di Harmony, pasar Morpho yang tidak tercantum dan protokol lain.",

  pricingTitle: "Harga",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Peringatan", detail: capitalize(alertPrice) },
    { term: "Perpanjangan", detail: "Tidak otomatis: bayar lagi saat Anda ingin menambah waktu" },
    {
      term: "Pembayaran",
      detail: paymentChain
        ? `USDC di jaringan ${paymentChain}, dari dompet Anda (setujui, lalu bayar)`
        : "USDC, dari dompet Anda",
    },
  ],
  priceSource: "Harga dibaca dari kontrak pembayaran dan diperbarui setiap jam.",
  pricingFootnote: "Melihat posisi Anda tidak perlu membayar.",

  questionsTitle: "Pertanyaan sebelum Anda menghubungkan dompet",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const onChain = idOnChain(paymentChain);
    return [
      {
        question: "Bisakah Tokenping menyentuh dana saya?",
        answer: rich(
          `Tidak. Tokenping hanya membaca posisi Anda dan tidak pernah meminta persetujuan atau tanda tangan di Aave atau Morpho. Satu-satunya transaksi adalah pembayaran ${onChain}: persetujuan untuk jumlah persis sebesar harganya, lalu pembayaran. `,
          links.sourcify
            ? rich(
                "Kontraknya ",
                links.sourcify("terverifikasi di Sourcify"),
                " dan ",
                links.sourceCode("kode sumbernya publik"),
              )
            : links.sourceCode("Kode sumber kontraknya publik"),
          "; dompet tim dapat mengubah harganya, menjedanya dan memperbaruinya (upgrade).",
        ),
      },
      {
        question: "Apa yang Anda simpan?",
        answer: rich(
          "Alamat dompet Anda, peringatan Anda dan detail kontak yang Anda berikan (email, nama pengguna Signal",
          hasTelegram ? ", obrolan Telegram" : "",
          `). Tanpa riwayat dan tanpa cookie pelacak; tampilan halaman dihitung secara anonim. Hanya orang yang dapat menandatangani dengan dompet Anda yang dapat membaca detail kontak tersebut, tetapi pembayaran ${onChain} bersifat publik. Daftar lengkapnya ada di `,
          links.privacy("halaman privasi"),
          ".",
        ),
      },
      {
        question: "Berapa biayanya?",
        answer: rich(
          `Peringatan dikenai biaya ${alertPrice}, dalam USDC ${onChain}, ditambah sedikit ETH untuk gas. Melihat posisi Anda tidak perlu membayar. Tanpa perpanjangan otomatis, tanpa pengembalian dana.`,
        ),
      },
      {
        question: "Pinjaman Morpho mana yang dicakup?",
        answer: rich(
          `Pinjaman Morpho Blue (bunga mengambang) dan Morpho Midnight (bunga tetap) di pasar yang tercantum di aplikasi Morpho, dengan ambang batas mulai ${formatDecimal("id", morphoMin)}. Pinjaman bunga tetap juga mendapat pengingat sebelum jatuh tempo. Paket yang sama mencakupnya: buka `,
          links.morphoDashboard("dasbor Morpho"),
          ".",
        ),
      },
      {
        question: "Bagaimana jika peringatan tidak sampai?",
        answer: rich(
          "Pemeriksaan berikutnya, ",
          minutes,
          " menit kemudian, mencoba lagi. Pengiriman bergantung pada Resend, sebuah relay Signal,",
          hasTelegram ? " Telegram Bot API," : "",
          " node RPC publik dan penjadwal Vercel, tanpa jaminan waktu aktif. Pilih dua saluran dan sisakan waktu untuk bertindak.",
        ),
      },
      {
        question: "Bagaimana cara menghentikan peringatan?",
        answer: rich(
          "Peringatan berhenti saat faktor kesehatan Anda kembali di atas batas Anda, atau saat Anda menghapus peringatan (memerlukan akses aktif). Akses sudah berakhir? Kirim pesan kepada kami di ",
          links.x("X"),
          " atau di komunitas kami di ",
          links.telegramCommunity("Telegram"),
          " atau ",
          links.signalCommunity("Signal"),
          ".",
          hasTelegram ? " Di Telegram, /stop juga bisa." : "",
          " Belum ada fitur tunda dan belum ada tautan berhenti berlangganan.",
        ),
      },
      {
        question: "Bisakah saya memantau dompet yang tidak saya hubungkan?",
        answer: rich("Belum untuk saat ini. Satu dompet, yaitu yang Anda hubungkan; akses berlaku per dompet."),
      },
      {
        question: "Alat lain tidak memungut biaya. Mengapa membayar?",
        answer: rich(
          "Jika bot Telegram atau aplikasi seluler cocok untuk Anda, gunakan saja",
          links.comparison ? rich(": ", links.comparison("perbandingan kami"), " membahasnya") : null,
          ". Tokenping untuk peringatan lewat Signal atau email, di setiap pasar Aave dan pasar Morpho yang tercantum.",
        ),
      },
    ];
  },

  limitsTitle: "Batasan, terus terang",
  limits: ({ minutes, paymentChain, repeatMinutes }) => [
    `Pemeriksaan setiap ${minutes} menit, tidak terus-menerus.`,
    `Di bawah batas Anda, pesan dikirim setiap ${repeatMinutes} menit: tanpa tunda atau ringkasan.`,
    "Satu batas per pasar, hanya untuk dompet yang terhubung.",
    `Hanya USDC${paymentChain ? ` di jaringan ${paymentChain}` : ""}: tanpa kartu, tanpa pengembalian dana.`,
    "Belum ada tautan berhenti berlangganan di email; menghapus peringatan memerlukan akses aktif.",
    "Beta: pengiriman lewat pihak ketiga, tanpa jaminan waktu aktif.",
  ],

  blogTitle: "Dari blog",
  allGuides: "Semua panduan Aave dan Morpho",

  closingTitle: "Atur peringatan faktor kesehatan Aave atau Morpho Anda",
  closingLead: alertPrice => `${capitalize(alertPrice)}, dibayar dari dompet Anda. Tanpa perpanjangan otomatis.`,
};
