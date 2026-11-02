import type { PrivacyMessages } from "./shared";

const ATTRIBUTION_QUESTION_ID = "“Dari mana Anda mengetahui Tokenping?”";

export const MESSAGES: PrivacyMessages = {
  metaTitle: "Privasi dan data",
  metaDescription:
    "Apa yang disimpan Tokenping saat Anda mengatur peringatan faktor kesehatan Aave, apa yang tidak, layanan yang menangani data Anda dan cara menghapusnya.",
  crumbHome: "Beranda",
  crumbPrivacy: "Privasi",
  title: "Privasi: apa yang disimpan Tokenping dan siapa yang menanganinya",
  lastUpdated: "Terakhir diperbarui",
  intro:
    "Halaman ini menjelaskan apa yang dilakukan aplikasi saat ini. Tokenping masih dalam tahap beta, dan kami memperbarui halaman ini saat data yang kami kumpulkan berubah.",
  withoutUs: {
    title: "Yang dapat Anda lakukan tanpa memberi kami apa pun",
    text: "Membaca situs dan blog, serta melihat posisi Anda di dasbor, tidak menambahkan apa pun ke basis data kami. Untuk menampilkan posisi Anda, browser Anda meminta data Aave dompet Anda kepada penyedia RPC (tercantum di bawah), sehingga mereka melihat alamat dompet Anda.",
    morpho:
      "Di dasbor Morpho, browser Anda juga mengirim alamat dompet Anda ke API Morpho, yang menemukan pasar Morpho tempat Anda meminjam, dan membaca posisi Morpho Anda dari penyedia RPC yang sama.",
  },
  stored: {
    title: "Yang kami simpan saat Anda menyimpan peringatan",
    items: [
      "Alamat dompet Anda.",
      "Jaringan yang dituju peringatan, dan ambang batas Anda.",
      "Saluran yang Anda pilih, dan bahasa masing-masing.",
      "Alamat email Anda, jika Anda memilih email.",
      "Nama pengguna Signal Anda, jika Anda memilih Signal.",
      "Kapan peringatan dibuat dan terakhir diubah.",
      "Kapan terakhir kali Anda mengirim pesan tes di setiap saluran, untuk mengizinkan satu tes per saluran setiap 15 menit.",
    ],
    telegram:
      "Jika Anda memilih Telegram, kami menyimpan nama pengguna Telegram yang Anda ketik di peringatan. Saat akun tersebut menekan Start di bot Tokenping, kami juga menyimpan ID obrolannya dan kapan akun itu menekan Start, agar peringatan dapat sampai kepadanya. Siapa pun dapat memeriksa apakah suatu nama pengguna Telegram sudah menekan Start di bot.",
    attribution: `Jika Anda menjawab pertanyaan opsional ${ATTRIBUTION_QUESTION_ID} setelah menyimpan peringatan, kami menyimpan jawaban Anda dan waktunya bersama alamat dompet Anda.`,
  },
  notStored: {
    title: "Yang tidak kami simpan",
    items: [
      "Posisi Anda atau riwayat faktor kesehatan Anda. Keduanya dibaca langsung dan tidak disimpan.",
      "Catatan peringatan yang kami kirim.",
      `Piksel pelacak atau cookie iklan: situs ini tidak memakai satu pun. Saat Anda masuk dengan dompet, Tokenping memasang satu cookie yang hanya menyatakan dompet mana yang masuk; cookie ini berlaku 7 hari atau sampai Anda memutuskan dompet di situs ini. Selama Anda masuk, cookie kedua menyimpan permintaan masuk selama lima menit. Browser Anda menyimpan pilihan tema, koneksi dompet, dompet mana yang sudah masuk di browser itu, dan apakah browser itu sudah menampilkan pertanyaan ${ATTRIBUTION_QUESTION_ID} kepada Anda, di penyimpanan lokalnya sendiri.`,
      "Alamat IP di basis data kami. Vercel tetap menangani setiap permintaan, seperti tercantum di bawah. Saat pemeriksaan peringatan atau pengiriman pesan gagal, galatnya, yang dapat mencakup alamat dompet Anda dan penerimanya, masuk ke log server kami.",
    ],
  },
  whoCanSee: {
    title: "Siapa yang dapat melihat pengaturan peringatan Anda",
    tiedToWallet:
      "Pengaturan peringatan terikat pada alamat dompet, bukan pada akun dengan kata sandi. Untuk melihat atau mengubahnya, Anda menandatangani pesan dengan dompet tersebut, yang membuktikan bahwa alamat itu milik Anda. Ini bukan transaksi dan tidak memakan gas, dan satu tanda tangan berlaku 7 hari di browser tersebut.",
    anyone: hasTelegram =>
      `Hanya orang yang dapat menandatangani dengan dompet Anda yang dapat melihat alamat email${hasTelegram ? ", nama pengguna Signal dan nama pengguna Telegram" : " dan nama pengguna Signal"} yang tersimpan untuknya, atau mengubah maupun menghapus peringatannya. Catatan pembayaran publik yang dijelaskan di bawah tetap menunjukkan dompet mana yang sudah membayar.`,
    dontEnter:
      "Jangan masukkan alamat email atau nama pengguna Signal yang tidak ingin Anda kaitkan dengan alamat dompet Anda.",
  },
  processors: {
    title: "Siapa yang menangani data Anda",
    list: ({ minutes, hasTelegram }) => [
      {
        name: "Vercel",
        role: `Meng-hosting situs ini dan menjalankan pemeriksaan peringatan setiap ${minutes} menit.`,
        receives: "Setiap permintaan ke situs, termasuk alamat IP Anda, dan log server kami.",
      },
      {
        name: "Vercel Web Analytics",
        role: "Menghitung tampilan halaman, tanpa cookie.",
        receives:
          "Untuk setiap tampilan halaman: alamat halaman, situs asal Anda, perkiraan lokasi Anda, serta browser, sistem operasi dan jenis perangkat Anda. Pengunjung diwakili oleh hash dari permintaan yang berubah setiap 24 jam, sehingga kunjungan tidak dapat dikaitkan antarhari atau antarsitus.",
      },
      { name: "Supabase", role: "Basis data kami.", receives: "Pengaturan peringatan yang tercantum di atas." },
      { name: "Resend", role: "Mengirim email peringatan.", receives: "Alamat email Anda dan teks peringatan." },
      {
        name: "Fly.io (relay Signal kami)",
        role: "Meng-hosting server signal-cli-rest-api yang kami jalankan, yang meneruskan peringatan Signal ke Signal.",
        receives: "Nama pengguna Signal Anda dan teks peringatan (begitu pula Signal).",
      },
      ...(hasTelegram
        ? [
            {
              name: "Telegram",
              role: "Mengirim peringatan Telegram melalui Bot API-nya.",
              receives: "ID obrolan Telegram Anda dan teks peringatan.",
            },
          ]
        : []),
      {
        name: "Penyedia RPC (PublicNode, Alchemy dan endpoint publik jaringan)",
        role: "Menjawab pembacaan blockchain: dari browser Anda untuk dasbor, dan dari server kami untuk pemeriksaan peringatan serta untuk memeriksa tanda tangan masuk dari dompet pintar (smart wallet).",
        receives:
          "Alamat dompet yang dibaca (dan, saat Anda masuk, tanda tangan Anda), serta alamat IP Anda untuk pembacaan yang dilakukan dari browser Anda.",
      },
      {
        name: "API Morpho",
        role: "Menemukan pasar Morpho tercantum tempat dompet Anda meminjam, untuk dasbor Morpho, dan memberi tahu server kami apakah suatu pasar tercantum saat Anda menyimpan peringatan Morpho.",
        receives: "Alamat dompet Anda, serta alamat IP Anda untuk pencarian yang dilakukan browser Anda.",
      },
      {
        name: "WalletConnect",
        role: "Meneruskan koneksi antara situs ini dan aplikasi dompet Anda, jika Anda terhubung dengan WalletConnect.",
        receives:
          "Data yang dipertukarkan aplikasi dompet Anda dan situs ini untuk terhubung, seperti alamat dompet Anda.",
      },
    ],
    receives: receives => `Menerima: ${receives}`,
    ownPolicy: "Setiap layanan ini menangani data tersebut berdasarkan kebijakan privasinya sendiri.",
  },
  onChain: {
    title: "Apa yang publik di blockchain",
    text: paymentChainName =>
      `Pembayaran peringatan dilakukan di ${paymentChainName ?? "jaringan pembayaran"}. Setiap pembayaran mencatat alamat pembayar, token, jumlah, waktu, periode yang dibeli dan tanggal berakhir yang baru dalam event publik yang dapat dibaca siapa pun dan tidak dapat dihapus siapa pun. Pengaturan peringatan Anda tidak pernah ditulis ke blockchain.`,
  },
  retention: {
    title: "Berapa lama kami menyimpannya, dan cara menghapusnya",
    settings:
      "Pengaturan peringatan tetap ada sampai Anda menghapus peringatan di dasbor. Menghapus akan menghilangkan pengaturan jaringan tersebut, termasuk alamat email dan nama pengguna Signal, dan memerlukan akses aktif.",
    telegramStop:
      "Mengirim /stop ke bot Tokenping di Telegram memutus obrolan Anda dan menghentikan peringatan Telegram.",
    contact: {
      before: `Jika akses Anda sudah berakhir, atau Anda ingin jawaban ${ATTRIBUTION_QUESTION_ID} Anda dihapus, kirim pesan kepada kami di`,
      x: "X",
      middle: "atau di komunitas kami di",
      telegram: "Telegram",
      or: "atau",
      signal: "Signal",
      after: "dan kami akan menghapusnya.",
    },
    payments: "Pembayaran di blockchain tidak dapat dihapus oleh siapa pun.",
  },
  homepage: {
    before: "Pertanyaan tentang cara kerja peringatan dijawab di ",
    link: "beranda",
    after: ".",
  },
};
