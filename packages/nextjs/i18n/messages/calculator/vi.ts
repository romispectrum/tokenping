import type { CalculatorMessages } from "./shared";
import { joinList } from "~~/i18n/format";

export const MESSAGES: CalculatorMessages = {
  title: "Máy tính giá thanh lý Aave",
  intro:
    "Nhập từng tài sản thế chấp và khoản nợ của bạn để có hệ số sức khỏe và các mức giá mà tại đó vị thế có thể bị thanh lý. Công cụ dùng công thức của Aave V3: Σ(giá trị tài sản thế chấp × ngưỡng thanh lý) ÷ giá trị khoản nợ.",
  examplesLabel: "Tải một ví dụ tính sẵn:",
  examples: {
    "one-collateral": "10 WETH, nợ 12,000 USDC",
    "two-collaterals": "10 WETH + 0.2 WBTC, nợ 20,000 USDC",
    "volatile-debt": "10,000 USDC, đã vay 2.5 WETH",
  },
  defaultCollateralName: index => `Tài sản thế chấp ${index}`,
  defaultDebtName: "Tài sản đã vay",
  collateralLegend: index => `Tài sản thế chấp ${index}`,
  presetLabel: "Tài sản trên Aave V3 (tự điền ngưỡng)",
  eModeHint: (collateral, borrowable) =>
    `Ngưỡng này áp dụng cho ${joinList("vi", collateral)}; tài sản thế chấp khác giữ ngưỡng riêng của nó. Trong E-Mode này, bạn chỉ có thể vay ${joinList("vi", borrowable)}.`,
  otherAsset: "Tài sản khác: tự nhập ngưỡng",
  presetGroup: (market, date) => `${market} (đọc ngày ${date})`,
  presetLabels: {
    "ethereum-core-emode-eth": 'E-Mode "ETH correlated" (ví dụ WETH, wstETH, weETH)',
    "arbitrum-usdc": "USDC (gốc)",
  },
  nameLabel: "Tên tài sản",
  namePlaceholder: symbols => `ví dụ ${joinList("vi", symbols, "disjunction")}`,
  amountSupplied: "Số lượng đã gửi",
  price: "Giá (USD)",
  priceHint: "Giá oracle của Aave, hiển thị trên trang của tài sản trong ứng dụng Aave.",
  threshold: "Ngưỡng thanh lý (%)",
  thresholdHint: "Trong E-Mode, là ngưỡng của danh mục. Trên Aave V4, là collateral factor (hệ số tài sản thế chấp).",
  removeCollateral: index => `Xóa tài sản thế chấp ${index}`,
  addCollateral: "Thêm tài sản thế chấp thứ hai",
  debtLegend: "Khoản nợ",
  debtKindLegend: "Bạn đã vay gì?",
  debtKinds: { stable: "Một stablecoin (tính ở mức $1.00)", volatile: "Một tài sản biến động giá, như WETH" },
  debtAmount: { stable: "Số tiền đã vay (USD)", volatile: "Số lượng đã vay (token)" },
  debtAmountHint: "Tính cả tiền lãi đã cộng dồn đến nay.",
  debtPrice: "Giá của tài sản đã vay (USD)",
  errors: {
    number: "Nhập một số như 10 hoặc 0.25, dùng dấu chấm cho phần thập phân.",
    price: "Nhập giá lớn hơn 0.",
    threshold: "Nhập phần trăm lớn hơn 0 và tối đa là 100.",
    samePrice: (name, price) =>
      `${name} đã được nhập ở trên với giá ${price}. Hãy dùng cùng một giá: một tài sản chỉ có một giá.`,
  },
  eModeLead: "Không có kết quả: Aave không cho phép kết hợp này.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("vi", borrowable);
    const loanText = loan.kind === "stable" ? "khoản vay stablecoin" : `khoản vay ${loan.name}`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `E-Mode "${category}" của ${market} chỉ cho phép vay ${borrowableList}, nên tài khoản có ${loanText} ` +
      `không thể dùng ngưỡng ${thresholdPercent}% của E-Mode này. Thay vào đó, hãy chọn ngưỡng riêng của tài sản thế chấp${own}, hoặc vay ${borrowableList}.`
    );
  },
  results: {
    heading: "Kết quả",
    empty: "Nhập một số vào mỗi ô để xem kết quả.",
    summaryLine: (title, value) => `${title}: ${value}.`,
    healthFactor: "Hệ số sức khỏe",
    noDebt: "Không có nợ, nên không có gì để thanh lý.",
    liquidatableNow: "Dưới 1.00: vị thế có thể bị thanh lý ngay bây giờ.",
    liquidatableBelow: "Vị thế có thể bị thanh lý khi dưới 1.00.",
    none: "Không có",
    priceTitle: name => `Giá thanh lý của ${name}`,
    priceTitleBorrowed: name => `Giá thanh lý của ${name} (đã vay)`,
    priceTitleShared: name => `Giá thanh lý của ${name} (đã gửi và đã vay)`,
    recover: ({ name, change, now, rises, alike }) =>
      `Hệ số sức khỏe trở lại 1.00 nếu ${name}${alike ? " (cả phần đã gửi và phần đã vay)" : ""} ${
        rises ? "tăng" : "giảm"
      } ${change} so với ${now}, các giá khác không đổi.`,
    collateralFall: ({ change, now }) => `Giảm ${change} so với ${now}, nếu mọi giá khác giữ nguyên.`,
    collateralNone: name =>
      `Ngay cả ở mức $0, riêng ${name} cũng không thể kéo hệ số sức khỏe xuống dưới 1.00: tài sản thế chấp còn lại đủ bảo đảm khoản nợ.`,
    debtRise: ({ change, now }) =>
      `Tăng ${change} so với ${now}: tài sản đã vay càng tăng giá thì hệ số sức khỏe càng giảm.`,
    sharedRise: ({ name, change, now }) =>
      `Tăng ${change} so với ${now}: bạn đã vay nhiều ${name} hơn phần ${name} thế chấp được tính, nên khi giá tăng thì hệ số sức khỏe giảm. Các giá khác không đổi.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `Giảm ${change} so với ${now}, với ${name} đã vay ở cùng mức giá và mọi giá khác không đổi.`,
    sharedFallRows: ({ name, change, now }) =>
      `Giảm ${change} so với ${now} cho mọi dòng ${name}, nếu mọi giá khác giữ nguyên.`,
    bothSidesNeutral: name =>
      `${name} vừa là tài sản thế chấp vừa là khoản nợ của bạn, nên hai bên biến động cùng nhau và giá của nó không làm thay đổi hệ số sức khỏe. Tuy vậy, tiền lãi, một thay đổi ngưỡng hoặc giao dịch của chính bạn vẫn làm thay đổi hệ số này.`,
    bothSidesRecover: name =>
      `${name} nằm ở cả hai phía, nên hai bên biến động cùng nhau: không mức giá ${name} nào tự nó đưa hệ số sức khỏe trở lại 1.00.`,
    bothSidesSafe: name =>
      `${name} nằm ở cả hai phía, nên hai bên biến động cùng nhau: riêng giá của nó không thể kéo hệ số sức khỏe xuống dưới 1.00.`,
    uniformTitle: "Toàn bộ tài sản thế chấp cùng giảm",
    uniformDescription: prices =>
      `Nếu giá của mọi tài sản thế chấp giảm chừng này và giá của khoản nợ không đổi, hệ số sức khỏe chạm 1.00: ${joinList(
        "vi",
        prices.map(({ name, price }) => `${name} ở mức ${price}`),
      )}.`,
    ratioTitle: (numerator, denominator) => `Tỷ lệ giá ${numerator} ÷ ${denominator} khi bị thanh lý`,
    ratioDescription: (now, change, falls) =>
      `Hiện tại ${now}. Nếu cả hai giá cùng biến động, tỷ lệ này ${falls ? "giảm" : "tăng"} ${change} sẽ đưa hệ số sức khỏe về 1.00.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Tài sản thế chấp ${collateral}, tính theo ngưỡng thanh lý: ${weighted}. Hệ số sức khỏe = ${weighted} ÷ ${debt} nợ = ${healthFactor}.`,
  },
  noscript:
    "Máy tính cần JavaScript để tính lại. Kết quả ở trên là cho 10 WETH ở mức $2,400 (ngưỡng thanh lý 83%) với khoản nợ 12,000 USDC; các ví dụ tính sẵn trên trang này dùng cùng công thức.",
  disclaimer: {
    lead: "Ước tính mang tính giáo dục, không phải lời khuyên tài chính.",
    beforeDate:
      "Công cụ chỉ dùng những con số bạn nhập. Các tham số Aave hiện hành có thể thay đổi: các ngưỡng ở trên được đọc trên chuỗi (on-chain) vào ngày",
    afterDate:
      ", và quản trị (governance) hoặc Risk Stewards có thể thay đổi chúng bất cứ lúc nào. Giá oracle biến động, tiền lãi liên tục cộng vào khoản nợ của bạn, và mỗi giá thanh lý giả định mọi giá khác giữ nguyên. Hãy kiểm tra vị thế của bạn trong ứng dụng Aave trước khi hành động.",
  },
};
