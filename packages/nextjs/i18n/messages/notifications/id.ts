import type { NotificationMessages } from "./shared";
import { idOnMarket } from "~~/i18n/format";

// Read on a phone: short, plain sentences with the same facts as the English.
export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `Faktor kesehatan Aave Anda ${idOnMarket(chainName)} adalah ${healthFactor}. ` +
    `Ini di bawah ambang batas Anda, ${threshold}. ` +
    `Pertimbangkan untuk menambah jaminan atau melunasi utang agar tidak dilikuidasi.\n\nDikirim pada: ${timestamp}`,
  alertSubject: chainName => `Peringatan faktor kesehatan Aave - ${chainName}`,
  // The html footer says "Dibuat pada" (created at) where the text says "Dikirim pada" (sent at).
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p>Faktor kesehatan Aave Anda ${idOnMarket(chainName).replace(chainName, `<strong>${chainName}</strong>`)} adalah ` +
    `<strong>${healthFactor}</strong>. Ini di bawah ambang batas Anda, <strong>${threshold}</strong>.</p>` +
    `<p>Pertimbangkan untuk menambah jaminan atau melunasi utang agar tidak dilikuidasi.</p>` +
    `<p><small>Dibuat pada: ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "kritis", risky: "berisiko", safe: "aman" };
    const now =
      position.kind === "debt"
        ? `Saat ini: faktor kesehatan ${position.healthFactor} (${statusWord[position.status]}), jaminan ${position.collateral}, utang ${position.debt}.`
        : position.kind === "noDebt"
          ? `Saat ini: tidak ada utang, jadi tidak ada yang bisa dilikuidasi${position.collateral ? ` (jaminan ${position.collateral})` : ""}.`
          : position.kind === "none"
            ? "Saat ini: tidak ada posisi terbuka di pasar ini."
            : "Saat ini: posisi Anda tidak dapat dibaca. Peringatan sungguhan mencoba lagi di setiap pemeriksaan.";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "Ini di bawah ambang batas Anda. Pemeriksaan berikutnya akan mengirim peringatan sungguhan."
          : "Ini di atas ambang batas Anda. Saat ini tidak ada peringatan yang akan dikirim."
        : null;
    return [
      "Pesan tes dari Tokenping: peringatan di saluran ini berfungsi.",
      `Peringatan Anda: ${chainName}, saat faktor kesehatan turun di bawah ${threshold}.`,
      now,
      ...(verdict ? [verdict] : []),
      `Diperiksa setiap ${minutes} menit. Dikirim pada: ${timestamp}`,
    ];
  },
  testSubject: chainName => `Pesan tes Tokenping - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (LLTV ${market.lltv})`
      : `${market.loan} bunga tetap, jatuh tempo ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `Faktor kesehatan Morpho Anda ${idOnMarket(chainName, "network")} adalah ${healthFactor}. Ini di bawah ambang batas Anda, ${threshold}.`,
    `Pasar: ${market}.`,
    ...(preLiquidation
      ? [
          "Anda memilih ikut pra-likuidasi (pre-liquidation) di pasar ini. Jadi faktor kesehatan diukur terhadap batasnya yang lebih awal: di bawah 1, sebagian posisi Anda dapat dijual.",
        ]
      : []),
    "Pertimbangkan untuk menambah jaminan atau melunasi utang agar tidak dilikuidasi.",
    `Dikirim pada: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Peringatan faktor kesehatan Morpho - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `Pinjaman bunga tetap Morpho Anda ${idOnMarket(chainName, "network")} sudah jatuh tempo pada ${when}. Utangnya masih ${debt}.`,
          `Pasar: ${market}.`,
          "Sekarang pinjaman ini dapat dilikuidasi kapan saja, berapa pun faktor kesehatannya. Lunasi untuk menghindari likuidasi.",
          `Dikirim pada: ${timestamp}`,
        ]
      : [
          `Pinjaman bunga tetap Morpho Anda ${idOnMarket(chainName, "network")} jatuh tempo dalam ${stage === "7d" ? "7 hari" : "24 jam"}, pada ${when}.`,
          `Pasar: ${market}.`,
          `Utang: ${debt}.`,
          "Setelah jatuh tempo, utang yang belum dibayar dapat dilikuidasi. Jadi lunasi sebelum itu.",
          `Dikirim pada: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Pinjaman Morpho lewat jatuh tempo - ${chainName}`
      : `Pinjaman Morpho jatuh tempo dalam ${stage === "7d" ? "7 hari" : "24 jam"} - ${chainName}`,
};
