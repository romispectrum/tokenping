import type { CalculatorMessages } from "./shared";
import { joinList } from "~~/i18n/format";

// The calculator reads and shows numbers the app's way (a decimal point, "$2,400.00"), so the examples, hints and
// results keep the decimal point and group thousands with a space, which reads the same either way.
export const MESSAGES: CalculatorMessages = {
  title: "Kalkulator harga likuidasi Aave",
  intro:
    "Masukkan setiap aset jaminan dan utang Anda untuk melihat faktor kesehatan dan harga saat posisi dapat dilikuidasi. Kalkulator ini memakai rumus Aave V3: Σ(nilai jaminan × ambang likuidasi) ÷ nilai utang.",
  examplesLabel: "Muat contoh perhitungan:",
  examples: {
    "one-collateral": "10 WETH, utang 12 000 USDC",
    "two-collaterals": "10 WETH + 0.2 WBTC, utang 20 000 USDC",
    "volatile-debt": "10 000 USDC, 2.5 WETH dipinjam",
  },
  defaultCollateralName: index => `Jaminan ${index}`,
  defaultDebtName: "Aset utang",
  collateralLegend: index => `Jaminan ${index}`,
  presetLabel: "Aset Aave V3 (mengisi ambang batas)",
  eModeHint: (collateral, borrowable) =>
    `Ambang ini berlaku untuk ${joinList("id", collateral)}; jaminan lain tetap memakai ambangnya sendiri. Dalam E-Mode ini Anda hanya dapat meminjam ${joinList("id", borrowable)}.`,
  otherAsset: "Aset lain: masukkan ambang batas sendiri",
  presetGroup: (market, date) => `${market} (dibaca ${date})`,
  presetLabels: {
    "ethereum-core-emode-eth": "E-Mode “ETH correlated” (misalnya WETH, wstETH, weETH)",
    "arbitrum-usdc": "USDC (native)",
  },
  nameLabel: "Nama aset",
  namePlaceholder: symbols => `misalnya ${symbols.join(" atau ")}`,
  amountSupplied: "Jumlah disetor",
  price: "Harga (USD)",
  priceHint: "Harga oracle Aave, ditampilkan di halaman aset di aplikasi Aave.",
  threshold: "Ambang likuidasi (%)",
  thresholdHint: "Dalam E-Mode, ambang batas kategorinya. Di Aave V4, collateral factor.",
  removeCollateral: index => `Hapus jaminan ${index}`,
  addCollateral: "Tambah jaminan kedua",
  debtLegend: "Utang",
  debtKindLegend: "Apa yang Anda pinjam?",
  debtKinds: { stable: "Stablecoin (dihitung $1.00)", volatile: "Aset yang harganya berfluktuasi, seperti WETH" },
  debtAmount: { stable: "Jumlah dipinjam (USD)", volatile: "Jumlah dipinjam (token)" },
  debtAmountHint: "Sertakan bunga yang sudah terkumpul sejauh ini.",
  debtPrice: "Harga aset yang dipinjam (USD)",
  errors: {
    number: "Masukkan angka seperti 10 atau 0.25, dengan titik untuk desimal.",
    price: "Masukkan harga di atas 0.",
    threshold: "Masukkan persentase di atas 0 dan paling banyak 100.",
    samePrice: (name, price) =>
      `${name} sudah dimasukkan di atas dengan harga ${price}. Gunakan harga yang sama: satu aset punya satu harga.`,
  },
  eModeLead: "Tidak ada hasil: Aave tidak mengizinkan kombinasi ini.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("id", borrowable);
    const loanText = loan.kind === "stable" ? "pinjaman stablecoin" : `${loan.name} yang dipinjam`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `E-Mode “${category}” di ${market} hanya mengizinkan Anda meminjam ${borrowableList}, jadi akun dengan ${loanText} ` +
      `tidak dapat memakai ambang ${thresholdPercent}% miliknya. Pilih ambang batas jaminan itu sendiri${own}, atau pinjam ${borrowableList}.`
    );
  },
  results: {
    heading: "Hasil",
    empty: "Masukkan angka di setiap kolom untuk melihat hasilnya.",
    summaryLine: (title, value) => `${title}: ${value}.`,
    healthFactor: "Faktor kesehatan",
    noDebt: "Tidak ada utang, jadi tidak ada yang bisa dilikuidasi.",
    liquidatableNow: "Di bawah 1.00: posisi dapat dilikuidasi sekarang.",
    liquidatableBelow: "Posisi dapat dilikuidasi di bawah 1.00.",
    none: "Tidak ada",
    priceTitle: name => `Harga likuidasi ${name}`,
    priceTitleBorrowed: name => `Harga likuidasi ${name} (dipinjam)`,
    priceTitleShared: name => `Harga likuidasi ${name} (disetor dan dipinjam)`,
    recover: ({ name, change, now, rises, alike }) =>
      `Faktor kesehatan kembali ke 1.00 jika ${name} ${rises ? "naik" : "turun"} ${change} dari ${now}${
        alike ? ", baik yang disetor maupun yang dipinjam" : ""
      }, dengan harga lain tidak berubah.`,
    collateralFall: ({ change, now }) => `${change} di bawah ${now}, jika semua harga lain tetap sama.`,
    collateralNone: name =>
      `Bahkan di $0, ${name} saja tidak dapat menurunkan faktor kesehatan di bawah 1.00: jaminan lain menutupi utangnya.`,
    debtRise: ({ change, now }) =>
      `${change} di atas ${now}: aset yang dipinjam menurunkan faktor kesehatan saat harganya naik.`,
    sharedRise: ({ name, change, now }) =>
      `${change} di atas ${now}: Anda meminjam ${name} lebih banyak daripada nilai yang dihitung dari jaminan ${name} Anda, jadi kenaikan harga menurunkan faktor kesehatan. Harga lain tidak berubah.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `${change} di bawah ${now}, dengan ${name} yang dipinjam di harga yang sama dan semua harga lain tidak berubah.`,
    sharedFallRows: ({ name, change, now }) =>
      `${change} di bawah ${now} untuk setiap baris ${name}, jika semua harga lain tetap sama.`,
    bothSidesNeutral: name =>
      `${name} adalah jaminan sekaligus utang Anda, jadi keduanya bergerak bersama dan harganya tidak mengubah faktor kesehatan. Bunga, perubahan ambang batas atau transaksi Anda sendiri tetap mengubahnya.`,
    bothSidesRecover: name =>
      `${name} ada di kedua sisi, jadi keduanya bergerak bersama: tidak ada harga ${name} yang dengan sendirinya mengembalikan faktor kesehatan ke 1.00.`,
    bothSidesSafe: name =>
      `${name} ada di kedua sisi, jadi keduanya bergerak bersama: harganya saja tidak dapat menurunkan faktor kesehatan di bawah 1.00.`,
    uniformTitle: "Semua jaminan turun bersama",
    uniformDescription: prices =>
      `Jika semua harga jaminan turun sebesar ini dan harga utang tidak bergerak, faktor kesehatan mencapai 1.00: ${prices
        .map(({ name, price }) => `${name} di ${price}`)
        .join(" dan ")}.`,
    ratioTitle: (numerator, denominator) => `Harga ${numerator} ÷ ${denominator} saat likuidasi`,
    ratioDescription: (now, change, falls) =>
      `Saat ini ${now}. Jika kedua harga bergerak, ${falls ? "penurunan" : "kenaikan"} ${change} pada rasio ini membawa faktor kesehatan ke 1.00.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Jaminan ${collateral}, dihitung dengan ambang likuidasinya: ${weighted}. Faktor kesehatan = ${weighted} ÷ utang ${debt} = ${healthFactor}.`,
  },
  noscript:
    "Kalkulator memerlukan JavaScript untuk menghitung ulang. Hasil di atas adalah untuk 10 WETH pada $2 400 (ambang likuidasi 83%) terhadap utang 12 000 USDC; contoh perhitungan di halaman ini memakai rumus yang sama.",
  disclaimer: {
    lead: "Perkiraan untuk edukasi, bukan nasihat keuangan.",
    beforeDate:
      "Kalkulator hanya memakai angka yang Anda masukkan. Parameter Aave yang berlaku dapat berubah: ambang batas di atas dibaca on-chain pada",
    afterDate:
      ", dan governance atau Risk Stewards dapat mengubahnya kapan saja. Harga oracle bergerak, bunga terus menambah utang Anda, dan setiap harga likuidasi mengasumsikan semua harga lain tetap sama. Periksa posisi Anda di aplikasi Aave sebelum bertindak.",
  },
};
