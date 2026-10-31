import type { NotificationMessages } from "./shared";
import { viMarket, viMarketNoun } from "~~/i18n/format";

export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `Hệ số sức khỏe Aave của bạn trên ${viMarket(chainName)} là ${healthFactor}, ` +
    `thấp hơn ngưỡng ${threshold} của bạn. ` +
    `Hãy cân nhắc gửi thêm tài sản thế chấp hoặc trả bớt nợ để tránh bị thanh lý.\n\nGửi lúc: ${timestamp}`,
  alertSubject: chainName => `Cảnh báo hệ số sức khỏe Aave - ${chainName}`,
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p>Hệ số sức khỏe Aave của bạn trên ${viMarketNoun(chainName)} <strong>${chainName}</strong> là ` +
    `<strong>${healthFactor}</strong>, thấp hơn ngưỡng ` +
    `<strong>${threshold}</strong> của bạn.</p>` +
    `<p>Hãy cân nhắc gửi thêm tài sản thế chấp hoặc trả bớt nợ để tránh bị thanh lý.</p>` +
    `<p><small>Tạo lúc: ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "nguy cấp", risky: "rủi ro", safe: "an toàn" };
    const now =
      position.kind === "debt"
        ? `Hiện tại: hệ số sức khỏe ${position.healthFactor} (${statusWord[position.status]}), tài sản thế chấp ${position.collateral}, nợ ${position.debt}.`
        : position.kind === "noDebt"
          ? `Hiện tại: không có nợ, nên không có gì có thể bị thanh lý${position.collateral ? ` (tài sản thế chấp ${position.collateral})` : ""}.`
          : position.kind === "none"
            ? "Hiện tại: bạn không có vị thế nào đang mở trong thị trường này."
            : "Hiện tại: không đọc được vị thế của bạn. Cảnh báo thật sẽ thử lại ở mỗi lần kiểm tra.";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "Mức này thấp hơn ngưỡng của bạn, nên lần kiểm tra tiếp theo sẽ gửi cảnh báo thật."
          : "Mức này cao hơn ngưỡng của bạn, nên lúc này sẽ không có cảnh báo nào được gửi."
        : null;
    // Vietnamese nouns do not change after a number.
    return [
      "Tin nhắn thử từ Tokenping: cảnh báo qua kênh này hoạt động.",
      `Cảnh báo của bạn: ${chainName}, khi hệ số sức khỏe giảm xuống dưới ${threshold}.`,
      now,
      ...(verdict ? [verdict] : []),
      `Kiểm tra mỗi ${minutes} phút. Gửi lúc: ${timestamp}`,
    ];
  },
  testSubject: chainName => `Tin nhắn thử từ Tokenping - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (LLTV ${market.lltv})`
      : `${market.loan} lãi suất cố định, đáo hạn ngày ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `Hệ số sức khỏe Morpho của bạn trên mạng ${chainName} là ${healthFactor}, thấp hơn ngưỡng ${threshold} của bạn.`,
    `Thị trường: ${market}.`,
    ...(preLiquidation
      ? [
          "Bạn đã bật thanh lý trước (pre-liquidation) trên thị trường này, nên hệ số sức khỏe được đo theo mốc của nó, đến sớm hơn: dưới 1, một phần vị thế của bạn có thể bị bán.",
        ]
      : []),
    "Hãy cân nhắc gửi thêm tài sản thế chấp hoặc trả bớt nợ để tránh bị thanh lý.",
    `Gửi lúc: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Cảnh báo hệ số sức khỏe Morpho - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `Khoản vay lãi suất cố định Morpho của bạn trên mạng ${chainName} đã đáo hạn vào ${when} và vẫn còn ${debt} nợ.`,
          `Thị trường: ${market}.`,
          "Giờ đây khoản vay có thể bị thanh lý bất cứ lúc nào, dù hệ số sức khỏe là bao nhiêu. Hãy trả nợ để tránh bị thanh lý.",
          `Gửi lúc: ${timestamp}`,
        ]
      : [
          `Khoản vay lãi suất cố định Morpho của bạn trên mạng ${chainName} sẽ đáo hạn trong vòng ${stage === "7d" ? "7 ngày" : "24 giờ"}, vào ${when}.`,
          `Thị trường: ${market}.`,
          `Nợ: ${debt}.`,
          "Sau ngày đáo hạn, mọi khoản nợ chưa trả đều có thể bị thanh lý, nên hãy trả nợ trước thời điểm đó.",
          `Gửi lúc: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Khoản vay Morpho đã quá ngày đáo hạn - ${chainName}`
      : `Khoản vay Morpho đáo hạn trong vòng ${stage === "7d" ? "7 ngày" : "24 giờ"} - ${chainName}`,
};
