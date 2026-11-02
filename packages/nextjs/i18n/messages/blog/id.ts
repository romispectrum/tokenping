import type { BlogMessages } from "./shared";
// The alert price ("3 USDC per 30 hari" or the fallback) follows "Peringatan dikenai biaya".
import { formatDecimal } from "~~/i18n/format";

export const MESSAGES: BlogMessages = {
  crumbs: { home: "Beranda", blog: "Blog" },
  index: {
    title: "Panduan faktor kesehatan dan likuidasi Aave dan Morpho",
    description:
      "Panduan tentang faktor kesehatan Aave dan Morpho, likuidasi, harga likuidasi dan peringatan, dengan contoh perhitungan dan angka bertanggal dan bersumber.",
    kicker: "Panduan Aave dan Morpho",
    lead: "Cara kerja faktor kesehatan di Aave dan di Morpho, apa yang terjadi saat likuidasi, cara menghitung harga likuidasi Anda dan cara mendapat peringatan sebelum harga mendekatinya. Setiap angka dalam panduan ini menyebut sumbernya dan tanggal pemeriksaannya.",
    dashboardCta: "Buka dasbor Aave",
    morphoDashboardCta: "Buka dasbor Morpho",
    rss: "Berlangganan lewat RSS",
    startHere: "Mulai di sini",
    allGuides: "Semua panduan",
    empty: {
      title: "Belum ada panduan",
      description:
        "Panduan dalam Bahasa Indonesia sedang disiapkan. Berlangganan lewat RSS untuk menerimanya saat diterbitkan.",
      otherLanguage: "Baca panduan dalam bahasa Inggris",
    },
  },
  post: {
    kicker: "Panduan Aave V3",
    morphoKicker: "Panduan Morpho",
    byline: { author: "Oleh tim Tokenping", published: "Diterbitkan", updated: "Diperbarui" },
    readingTime: minutes => `${minutes} menit membaca`,
    readGuide: "Baca panduan",
    related: "Panduan terkait",
  },
  endBox: {
    label: "Tentang Tokenping",
    title: "Peringatan faktor kesehatan dari Tokenping",
    body: ({ minutes, networks, channels, price, paymentChain }) =>
      `Tokenping memeriksa faktor kesehatan Aave V3 dan V4 Anda setiap ${minutes} menit di ${networks} jaringan dan mengirim pesan kepada Anda lewat ${channels} saat nilainya di bawah ambang batas Anda. Peringatan dikenai biaya ${price}${paymentChain ? `, dibayar di jaringan ${paymentChain}` : ""}; melihat posisi tidak perlu membayar. Peringatan memberi Anda waktu untuk bertindak; peringatan tidak mencegah likuidasi.`,
    cta: "Buka dasbor",
    morpho: {
      title: "Peringatan faktor kesehatan Morpho dari Tokenping",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tokenping memeriksa faktor kesehatan Morpho Blue dan Midnight Anda setiap ${minutes} menit di ${networks} jaringan dan mengirim pesan kepada Anda lewat ${channels} saat nilainya di bawah ambang batas Anda, dengan pengingat sebelum pinjaman bunga tetap jatuh tempo. Peringatan dikenai biaya ${price}${paymentChain ? `, dibayar di jaringan ${paymentChain}` : ""}, paket yang sama dengan peringatan Aave; melihat posisi tidak perlu membayar. Peringatan memberi Anda waktu untuk bertindak; peringatan tidak mencegah likuidasi.`,
      cta: "Buka dasbor Morpho",
    },
  },
  alertPrice: {
    fallback: "sejumlah kecil USDC (lihat harga saat ini di dasbor)",
    plan: ({ priceLabel, days }) =>
      days === 1
        ? `${formatDecimal("id", priceLabel)} per hari`
        : `${formatDecimal("id", priceLabel)} per ${days} hari`,
  },
  callout: { info: "Catatan", warning: "Perhatian" },
  shortAnswer: "Jawaban singkat",
  scopeNote: {
    text: "Berlaku untuk Aave V3.7, diperiksa di pasar Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche dan Gnosis. Pasar dan jaringan V3 lain mungkin menjalankan versi yang lebih lama. Perbedaan Aave V4 dicatat di bagian yang aturannya berbeda.",
    morphoText:
      "Berlaku untuk pasar Morpho Blue dan Morpho Midnight yang tercantum di aplikasi Morpho. Setiap pasar menetapkan jaminan, oracle dan LLTV-nya sendiri, jadi periksa angka pasar Anda.",
    figuresAsOf: "Angka per",
  },
  table: {
    fallbackLabel: "Tabel, dapat digeser ke samping",
    label: (heading, index) => (index === undefined ? `Tabel: ${heading}` : `Tabel ${index}: ${heading}`),
    scrollHint: "Geser ke samping untuk melihat semua kolom.",
  },
};
