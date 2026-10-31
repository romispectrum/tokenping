import type { MorphoMessages } from "./shared";
import { viMarket } from "~~/i18n/format";

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Cảnh báo hệ số sức khỏe trên Morpho Blue và Midnight",
    metaDescription: (networkCount, channels) =>
      `Cảnh báo hệ số sức khỏe cho khoản vay Morpho Blue và Midnight qua ${channels}, trên ${networkCount} mạng, kèm lời nhắc trước ngày đáo hạn của khoản vay.`,
    title: "Vị thế Morpho Blue, Midnight và cảnh báo hệ số sức khỏe",
    intro: networks =>
      `Các vị thế vay của bạn trong những thị trường mà ứng dụng Morpho liệt kê, trên các mạng ${networks}: khoản vay lãi suất thả nổi (Morpho Blue) và khoản vay lãi suất cố định (Morpho Midnight). Hệ số sức khỏe được đọc trực tiếp từ blockchain.`,
    checks: minutes =>
      `Cảnh báo được kiểm tra ${minutes} phút một lần. Khoản vay lãi suất cố định còn nhận lời nhắc 7 ngày và 1 ngày trước ngày đáo hạn, và một cảnh báo ở mỗi lần kiểm tra sau ngày đáo hạn khi vẫn còn nợ.`,
    access: "Một lần thanh toán quyền truy cập áp dụng cho cả cảnh báo Aave và Morpho của bạn.",
    notAffiliated: "Tokenping không liên kết với Morpho.",
    guideHealthFactor: "Cách hệ số sức khỏe trên Morpho hoạt động",
    guideLiquidation: "Cách thanh lý trên Morpho hoạt động",
    guideMidnight: "Khoản vay lãi suất cố định trên Morpho Midnight",
    aaveDashboard: "Bạn vay trên Aave? Mở bảng điều khiển Aave",
  },
  positionsHeading: "Vị thế Morpho của bạn",
  gate: {
    title: "Kết nối ví để tiếp tục",
    description:
      "Tokenping cần địa chỉ ví của bạn để tìm các vị thế Morpho của bạn. Việc kết nối không chuyển tiền và không mất phí.",
    connect: "Kết nối ví",
    connecting: "Đang kết nối",
    approveInWallet: "Hãy xác nhận kết nối trong ví của bạn.",
  },
  list: {
    heading: "Thị trường",
    count: count => `${count} có nợ`,
    none: "Không tìm thấy khoản vay nào trong các thị trường mà ứng dụng Morpho liệt kê.",
    discoveryFailed: "API của Morpho không phản hồi, nên chỉ những thị trường có cảnh báo đã lưu được liệt kê.",
    variableRate: "Lãi suất thả nổi",
    fixedRate: "Lãi suất cố định",
    matures: date => `Đáo hạn ngày ${date}`,
    matured: "Đã qua ngày đáo hạn",
    unreadable: "Không đọc được",
    noneSelectedDescription: "Chọn một thị trường để xem vị thế Morpho của bạn.",
  },
  details: {
    collateralValue: "Giá trị tài sản thế chấp",
    debt: "Nợ",
    ltv: "LTV",
    lltv: "LTV thanh lý",
    maturity: "Ngày đáo hạn",
    // Vietnamese nouns do not change after a number, so the number is written into one form.
    timeLeft: (days, hours) => (days > 0 ? `còn ${days} ngày` : `còn ${hours} giờ`),
    pastMaturity:
      "Khoản vay này đã qua ngày đáo hạn: phần nợ còn lại có thể bị thanh lý bất cứ lúc nào, bất kể hệ số sức khỏe. Hãy trả nợ để tránh bị thanh lý.",
    preLiquidation: "Thanh lý trước",
    preLiquidationNote:
      "Bạn đã chọn tham gia thanh lý trước (pre-liquidation) trên thị trường này, nên hệ số sức khỏe được đo theo ngưỡng sớm hơn của cơ chế đó: dưới 1, một phần vị thế của bạn có thể bị bán.",
    amountsIn: token => `Số tiền tính bằng ${token}, được định giá theo oracle của thị trường.`,
    noDebtTitle: "Không có nợ trên thị trường này",
    noDebtDetail: "Cảnh báo đã lưu vẫn được giữ, và không gửi gì khi không có nợ.",
    unreadableTitle: "Không đọc được vị thế này",
    unreadableDetail: "Mạng không phản hồi. Cảnh báo của bạn vẫn tiếp tục được kiểm tra.",
  },
  paywall: {
    descriptionNew: marketName =>
      `Thanh toán một lần để đặt cảnh báo hệ số sức khỏe trên ${viMarket(marketName, "market")} và các thị trường khác. Không có gì tự động gia hạn: bạn thanh toán từ ví của mình khi muốn gia hạn.`,
    descriptionExtend: marketName =>
      `Cài đặt cảnh báo bạn đã lưu cho ${viMarket(marketName, "market")} vẫn còn trong tài khoản của bạn. Thanh toán lại để gia hạn quyền truy cập và chỉnh sửa chúng.`,
  },
};
