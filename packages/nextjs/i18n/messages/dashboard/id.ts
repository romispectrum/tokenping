import type { DashboardMessages } from "./shared";
import { idForMarket, idOnMarket, plural } from "~~/i18n/format";

/** "1 hari", "30 hari": Indonesian has no plural, so both forms read the same. */
const days = (count: number) => plural("id", count, { one: `${count} hari`, other: `${count} hari` });

export const MESSAGES: DashboardMessages = {
  page: {
    metaTitle: "Posisi Aave V3 dan V4 serta faktor kesehatan",
    metaDescription: (networkCount, channels) =>
      `Lihat jaminan, utang dan faktor kesehatan Aave V3 dan V4 Anda di ${networkCount} jaringan, lalu atur peringatan ${channels}, satu ambang per pasar.`,
    title: "Posisi Aave V3 dan V4 serta peringatan faktor kesehatan",
    networkMarkets: (name, markets) => `${name} (pasar ${markets})`,
    intro: (v3Networks, v4Networks) =>
      `Hubungkan dompet yang Anda gunakan untuk meminjam untuk melihat jaminan, utang dan faktor kesehatannya di Aave V3 di ${v3Networks}, serta di setiap Spoke Aave V4 di ${v4Networks}. Melihat posisi tidak memerlukan transaksi.`,
    disclosureSummary: "Biaya peringatan dan seberapa sering kami memeriksa",
    alertsCost: (channels, paymentChain) =>
      `Untuk menerima pesan lewat ${channels} saat faktor kesehatan suatu pasar turun di bawah ambang batas pilihan Anda, buka peringatan dengan pembayaran USDC${paymentChain ? ` di jaringan ${paymentChain}` : ""}. Harga saat ini ditampilkan sebelum Anda membayar.`,
    checks: (minutes, repeatMinutes) =>
      `Tokenping memeriksa setiap ${minutes} menit. Selama faktor kesehatan tetap di bawah ambang batas Anda, Anda menerima pesan setiap ${repeatMinutes} menit di setiap saluran yang Anda pilih.`,
    guideThreshold: "Cara memilih ambang batas",
    guideAlerts: "Cara kerja peringatan",
    morphoDashboard: "Meminjam di Morpho? Buka dasbor Morpho",
  },
  gate: {
    title: "Hubungkan dompet untuk melanjutkan",
    description:
      "Tokenping memerlukan alamat dompet Anda untuk menampilkan posisi Aave Anda. Menghubungkan dompet tidak memindahkan dana dan tidak dikenai biaya.",
    connect: "Hubungkan dompet",
    connecting: "Menghubungkan",
    approveInWallet: "Setujui koneksi di dompet Anda.",
  },
  positionsHeading: "Posisi Aave Anda",
  loadingDashboard: "Memuat dasbor Anda",
  toolbar: {
    wallet: "Dompet",
    refresh: "Muat ulang posisi",
    refreshing: "Memuat ulang",
    loadingPositions: "Memuat posisi",
  },
  errors: {
    positionsDidNotLoad: "Posisi gagal dimuat",
    refreshFailed: "Gagal memuat ulang",
    showingLastPositions: "Menampilkan posisi dari pemuatan terakhir yang berhasil.",
    tryAgain: "Coba lagi",
    fetchPositionsFailed: "Gagal mengambil posisi Aave",
  },
  totals: {
    supplied: "Total disetor",
    borrowed: "Total dipinjam",
    netWorth: "Nilai bersih",
    noData: "Tidak ada data",
  },
  networks: {
    heading: "Pasar",
    active: count => plural("id", count, { one: `${count} aktif`, other: `${count} aktif` }),
    noPositions: "Tidak ada posisi Aave aktif yang terdeteksi di pasar yang didukung.",
    selectedRegion: "Pasar yang dipilih",
    noneSelectedTitle: "Belum ada pasar yang dipilih",
    noneSelectedDescription: "Pilih pasar untuk melihat posisi Aave-nya.",
    otherMarkets: count => `Pasar lain (${count})`,
    otherMarketsHint: "Pasar yang diperiksa Tokenping tempat dompet ini tidak punya posisi dan tidak punya peringatan.",
    alertSet: "Peringatan aktif",
    supplied: usd => `${usd} disetor,`,
    borrowed: usd => `${usd} dipinjam`,
    noPosition: "Tidak ada posisi",
  },
  healthFactor: {
    srPrefix: "Faktor kesehatan ",
    noDebt: "Tidak ada utang",
    critical: "Kritis",
    risky: "Berisiko",
    safe: "Aman",
  },
  position: {
    market: version => (version === 4 ? "Spoke Aave V4" : "Pasar Aave V3"),
    noPositionTitle: chainName => `Tidak ada posisi aktif ${idOnMarket(chainName)}`,
    noPositionDetail: chainName =>
      `Aave tidak mencatat jaminan maupun utang untuk dompet ini ${idOnMarket(chainName)}.`,
    collateral: "Jaminan",
    debt: "Utang",
    netWorth: "Nilai bersih",
    suppliedTitle: "Disetor",
    borrowedTitle: "Dipinjam",
    noCollateral: "Tidak ada jaminan yang disetor",
    noDebt: "Tidak ada utang tersisa",
    tokenIconsFrom: "Ikon token dan jaringan dari",
    tokenDetailsFailedTitle: "Detail token gagal dimuat",
    tokenDetailsFailedBody: "Total di atas berasal dari ringkasan akun Aave. Muat ulang posisi untuk mencoba lagi.",
  },
  tokens: {
    asset: "Aset",
    supplied: "Disetor",
    supplyApy: "APY setoran",
    collateral: "Jaminan",
    borrowed: "Dipinjam",
    rateType: "Jenis bunga",
    enabled: "Aktif",
    disabled: "Nonaktif",
    stable: amount => `Stabil ${amount}`,
    variable: amount => `Mengambang ${amount}`,
    count: count => plural("id", count, { one: `${count} aset`, other: `${count} aset` }),
  },
  address: {
    defaultLabel: "Alamat",
    copy: (_label, address) => `Salin alamat ${address}`,
    copied: "Alamat disalin",
    copyFailed: "Gagal menyalin. Pilih alamat lalu salin secara manual.",
  },
  opensInNewTab: "(terbuka di tab baru)",
  paywall: {
    unlockedUntil: date => `Peringatan terbuka hingga ${date}`,
    titleNew: "Buka peringatan faktor kesehatan",
    titleExtend: "Perpanjang akses untuk mengedit peringatan Anda",
    descriptionNew:
      "Bayar sekali untuk membuka pengaturan peringatan dan mengatur ambang batas faktor kesehatan untuk setiap jaringan. Tidak ada yang diperpanjang otomatis: Anda membayar dari dompet saat ingin memperpanjang.",
    descriptionExtend:
      "Pengaturan peringatan Anda sebelumnya tersimpan. Bayar lagi untuk memperpanjang akses dan mengeditnya.",
    networkDescriptionNew: chainName =>
      `Bayar sekali untuk mengatur peringatan faktor kesehatan ${idOnMarket(chainName)} dan pasar lain. Tidak ada yang diperpanjang otomatis: Anda membayar dari dompet saat ingin memperpanjang.`,
    networkDescriptionExtend: chainName =>
      `Pengaturan peringatan Anda yang tersimpan ${idForMarket(chainName)} masih ada di akun Anda. Bayar lagi untuk memperpanjang akses dan mengeditnya.`,
    connectWallet: "Hubungkan dompet Anda untuk membayar akses.",
    unconfigured: "Kontrak pembayaran belum dikonfigurasi untuk jaringan ini.",
    noPlan: "Saat ini tidak ada paket berbayar yang tersedia.",
    paused: "Pembayaran sedang dijeda. Coba lagi nanti.",
    statusUnavailable: "Gagal memuat status pembayaran. Muat ulang halaman untuk mencoba lagi.",
    wrongNetworkTitle: "Jaringan salah",
    wrongNetworkBody: (walletChain, target) =>
      `Dompet Anda ada di ${walletChain ?? "jaringan lain"}. Beralih ke ${target ?? "jaringan pembayaran"} untuk membayar.`,
    switchTo: target => `Beralih ke ${target ?? "jaringan pembayaran"}`,
    switching: "Mengganti jaringan",
    loadingDetails: "Memuat detail pembayaran",
    price: "Harga",
    access: "Akses",
    network: "Jaringan",
    networkFee: "Biaya jaringan",
    networkFeeValue: symbol => `Dibayar dalam ${symbol} untuk setiap langkah, ditampilkan di dompet Anda`,
    period: (count, about) => (about ? `Sekitar ${days(count)}` : days(count)),
    pay: amount => `Bayar ${amount}`,
    extend: (count, amount) => `Tambah ${days(count)} seharga ${amount}`,
    extendHint: count =>
      `Setiap pembayaran menambah ${days(count)} setelah tanggal berakhir Anda saat ini. Bayar sebanyak yang Anda mau; tidak ada yang diperpanjang dengan sendirinya.`,
    accessExtended: date => `Akses diperpanjang hingga ${date}.`,
    accessActive: "Akses aktif. Sekarang Anda dapat mengatur peringatan.",
    paymentPending: "Pembayaran terkonfirmasi. Akses akan segera muncul.",
    loading: {
      processing: "Memproses",
      waitingForWallet: "Menunggu dompet Anda",
      approving: "Menyetujui",
      paying: "Membayar",
    },
    unavailable: "Akses berbayar sedang tidak tersedia.",
    checkFailed: "Gagal memeriksa status pembayaran. Coba lagi sebentar lagi.",
    approvalNotVisible: "Persetujuan sudah terkonfirmasi tetapi belum terlihat. Coba lagi sebentar lagi.",
  },
  payment: {
    stepsLabel: "Langkah pembayaran",
    approveTitle: amount => `Setujui ${amount}`,
    approveHint:
      "Mengizinkan paywall mengambil jumlah persis ini. Dilewati jika persetujuan sebelumnya sudah mencakupnya.",
    payTitle: amount => `Bayar ${amount}`,
    payHint: "Mengirim pembayaran dan membuka peringatan.",
    inProgress: "Sedang berjalan",
    done: "Selesai",
    notNeeded: "Tidak diperlukan",
    transaction: "Transaksi ",
    viewOn: explorer => `Lihat di ${explorer}`,
    preparingTitle: "Menyiapkan pembayaran",
    preparingBody: "Memeriksa harga saat ini dan persetujuan Anda.",
    confirmTitle: "Konfirmasi di dompet Anda",
    approveSignBody: amount => `Langkah 1 dari 2: setujui ${amount}. Tidak ada yang dikirim sebelum Anda konfirmasi.`,
    processingOn: network => `Memproses di ${network ?? "jaringan"}`,
    approvePendingBody:
      "Langkah 1 dari 2: persetujuan dikirim. Berikutnya dompet Anda meminta Anda mengonfirmasi pembayaran.",
    paySignBody: amount => `Langkah 2 dari 2: bayar ${amount}. Tidak ada yang dikirim sebelum Anda konfirmasi.`,
    payPendingBody: "Langkah 2 dari 2: pembayaran dikirim. Peringatan terbuka setelah jaringan mengonfirmasinya.",
  },
};
