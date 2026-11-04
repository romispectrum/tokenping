import { type HomeMessages, rich } from "./shared";
import { capitalize, formatDecimal } from "~~/i18n/format";

/** "mỗi 5 phút", "mỗi phút". */
const viEveryMinutes = (minutes: number) => (minutes === 1 ? "mỗi phút" : `mỗi ${minutes} phút`);

const viNetworks = (networks: number) => `${networks} mạng`;

const viMarkets = (markets: number) => `${markets} thị trường`;

/** "13 Spoke": the Aave term, uncounted in Vietnamese. */
const viSpokes = (spokes: number) => `${spokes} Spoke`;

/** "trên mạng Arbitrum One", or the payment network unnamed. */
const viOnChain = (chainName: string | undefined) => (chainName ? `trên mạng ${chainName}` : "trên mạng thanh toán");

// Vietnamese nouns do not change after a number ("1 ngày", "30 ngày", "29 mạng").
const viDays = (days: number) => `${days} ngày`;

export const MESSAGES: HomeMessages = {
  headline: channels => `Cảnh báo hệ số sức khỏe trên Aave và Morpho qua ${channels}`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `Cảnh báo qua ${channels} khi hệ số sức khỏe trên Aave hoặc Morpho dưới ngưỡng của bạn, trên ${viNetworks(networks)}, ${viEveryMinutes(minutes)}.`
      : `Cảnh báo qua ${channels} khi hệ số sức khỏe trên Aave hoặc Morpho giảm xuống dưới ngưỡng của bạn, trên ${viNetworks(networks)}. Kiểm tra ${viEveryMinutes(minutes)}.`,
  channelBadge: capitalize,
  pricingCta: plan =>
    plan ? `Cài đặt cảnh báo: ${formatDecimal("vi", plan.priceLabel)} trong ${viDays(plan.days)}` : "Cài đặt cảnh báo",
  offerDescription: ({ days, currency }) =>
    `Cảnh báo hệ số sức khỏe trong ${viDays(days)}, thanh toán bằng ${currency} từ ví của bạn. Không tự động gia hạn.`,

  kicker: "Aave V3 và V4, Morpho Blue và Midnight",
  heroLead: ({ minutes, channels }) =>
    `Kiểm tra ${viEveryMinutes(minutes)}. Một tin nhắn qua ${channels} khi bạn còn ở dưới ngưỡng của mình. Chỉ đọc, không cần phê duyệt.`,
  networksLabel: "Mạng",
  heroCoverage: networks => viNetworks(networks),
  channelsLabel: "Cảnh báo qua:",
  exampleAlertLabel: "Nội dung một cảnh báo",
  exampleAlertCaption: subject => `Ví dụ. Email được gửi đến với tiêu đề "${subject}".`,

  dashboardCta: "Mở bảng điều khiển Aave",
  morphoDashboardCta: "Mở bảng điều khiển Morpho",
  dashboardCtaMicrocopy: alertPrice => `Kết nối ví và xem mọi vị thế của bạn. Cảnh báo có giá ${alertPrice}.`,

  problemTitle: "Hệ số sức khỏe giảm trong khi bạn ngủ",
  problemLead:
    "Aave hiển thị hệ số sức khỏe của bạn nhưng không gửi cảnh báo (tháng 10 năm 2026). Ba điều làm nó thay đổi qua đêm:",
  problemCauses: [
    { title: "Giá giảm", body: "ETH giảm và tài sản thế chấp của bạn mất giá." },
    { title: "Lãi cộng dồn", body: "Khoản nợ của bạn tăng lên từng giây." },
    { title: "Ngưỡng thay đổi", body: "Trên Aave, cơ chế quản trị có thể hạ ngưỡng thanh lý." },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Có người vay kể lại chuyện ",
      morning("thức dậy thấy vị thế đã bị thanh lý"),
      ", ",
      failedRepays("một giờ liền giao dịch trả nợ thất bại"),
      " và ",
      polygon("một lần trả nợ ở mức 1,01 đã quá muộn"),
      ".",
    ),
  problemLiquidator: guide =>
    rich(
      "Bên thanh lý còn giữ thêm một khoản thưởng: 5% với WETH trên thị trường Ethereum Core (tháng 10 năm 2026).",
      guide && rich(" Xem ", guide("cách một vụ thanh lý diễn ra"), "."),
    ),
  chart: {
    threshold: "ngưỡng của bạn",
    liquidation: "thanh lý",
    alertSent: "Đã gửi cảnh báo",
    youCheck: "Bạn xem điện thoại",
    caption: "Một đêm ví dụ. Cảnh báo được gửi lúc 03:05, ở lần kiểm tra đầu tiên dưới 1,5, năm giờ trước khi bạn xem.",
  },

  howItWorksTitle: "Cách hoạt động",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? ` trên mạng ${paymentChain}` : "";
    return [
      {
        title: "Kết nối ví mà bạn dùng để vay",
        body: "Chỉ đọc. Aave và Morpho, mỗi bên một trang.",
      },
      {
        title: plan
          ? `Mở khóa cảnh báo với ${formatDecimal("vi", plan.priceLabel)}`
          : "Mở khóa cảnh báo với một khoản thanh toán nhỏ bằng USDC",
        body: `${plan ? `Quyền truy cập ${viDays(plan.days)}, thanh toán` : "Thanh toán"} bằng USDC${paidOn}. Không tự động gia hạn.`,
      },
      {
        title: "Chọn ngưỡng cho từng thị trường",
        body: `Từ ${formatDecimal("vi", threshold.min)} (${formatDecimal("vi", morphoMin)} trên Morpho) đến ${formatDecimal("vi", threshold.max)}, mặc định ${formatDecimal("vi", threshold.default)}.`,
      },
      {
        title: "Nhận tin nhắn khi bạn ở dưới ngưỡng",
        body: `${capitalize(viEveryMinutes(minutes))}, qua ${channels}, cho đến khi bạn trở lại trên ngưỡng của mình.`,
      },
    ];
  },
  scaleTitle: "Nên đặt ngưỡng ở đâu",
  scale: {
    liquidation: "thanh lý",
    critical: "Nguy cấp",
    risky: "Rủi ro",
    safe: "An toàn",
    defaultThreshold: value => `Mặc định: ${value}`,
    below: value => `Dưới ${value}`,
    between: (from, to) => `Từ ${from} đến ${to}`,
    andAbove: value => `Từ ${value} trở lên`,
    range: (min, max) => `Bất kỳ giá trị nào từ ${min} đến ${max}.`,
  },
  scaleGuide: "Cách chọn ngưỡng",

  coverageTitle: "Mọi thị trường Aave và mọi thị trường Morpho được liệt kê",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `${viMarkets(v3Markets)} Aave V3 trên ${viNetworks(v3Networks)} và ${viSpokes(spokes)} Aave V4 trên ${viNetworks(v4Networks)}, tính đến ngày 4 tháng 11 năm 2026, cùng mọi thị trường Morpho được liệt kê trên ${viNetworks(morphoNetworks)}.`,
  coverage: {
    v3Markets: count => `${viMarkets(count)} V3`,
    v4Spokes: count => `${viSpokes(count)} V4`,
    morpho: "Morpho",
  },
  coverageNote:
    "Cơ chế quản trị của Aave đang dần đóng các thị trường trên Scroll, ZKsync, Metis, Soneium và Sonic, và chúng tôi vẫn theo dõi chúng. Không hỗ trợ: Aave V3 trên Harmony, các thị trường Morpho không được liệt kê và các giao thức khác.",

  pricingTitle: "Giá",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Cảnh báo", detail: capitalize(alertPrice) },
    { term: "Gia hạn", detail: "Không tự động: thanh toán lại khi bạn muốn thêm thời gian" },
    {
      term: "Thanh toán",
      detail: paymentChain
        ? `USDC trên mạng ${paymentChain}, từ ví của bạn (phê duyệt, rồi thanh toán)`
        : "USDC, từ ví của bạn",
    },
  ],
  priceSource: "Giá được đọc từ hợp đồng thanh toán và cập nhật mỗi giờ.",
  pricingFootnote: "Xem vị thế của bạn không cần thanh toán.",

  questionsTitle: "Những câu nên hỏi trước khi kết nối ví",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const onChain = viOnChain(paymentChain);
    return [
      {
        question: "Tokenping có thể động đến tiền của tôi không?",
        answer: rich(
          `Không. Tokenping chỉ đọc vị thế của bạn và không bao giờ yêu cầu phê duyệt hay chữ ký trên Aave hoặc Morpho. Giao dịch duy nhất là khoản thanh toán ${onChain}: một lần phê duyệt đúng bằng mức giá, rồi đến khoản thanh toán. `,
          links.sourcify
            ? rich(
                "Hợp đồng đã được ",
                links.sourcify("xác minh trên Sourcify"),
                " và ",
                links.sourceCode("mã nguồn được công khai"),
              )
            : links.sourceCode("Mã nguồn của hợp đồng được công khai"),
          "; ví của đội ngũ có thể đổi giá, tạm dừng và nâng cấp hợp đồng.",
        ),
      },
      {
        question: "Tokenping lưu những gì?",
        answer: rich(
          "Địa chỉ ví, các cảnh báo và thông tin liên hệ mà bạn cung cấp (email, tên người dùng Signal",
          hasTelegram ? ", cuộc trò chuyện Telegram" : "",
          `). Không lưu lịch sử, không có cookie theo dõi; lượt xem trang được đếm ẩn danh. Chỉ người ký được bằng ví của bạn mới đọc được thông tin liên hệ đó, nhưng các khoản thanh toán thì công khai ${onChain}. `,
          links.privacy("Trang quyền riêng tư"),
          " có danh sách đầy đủ.",
        ),
      },
      {
        question: "Chi phí là bao nhiêu?",
        answer: rich(
          `Cảnh báo có giá ${alertPrice}, bằng USDC ${onChain}, cộng thêm một ít ETH cho phí gas. Xem vị thế của bạn không cần thanh toán. Không tự động gia hạn, không hoàn tiền.`,
        ),
      },
      {
        question: "Những khoản vay Morpho nào được hỗ trợ?",
        answer: rich(
          `Khoản vay Morpho Blue (lãi suất thả nổi) và Morpho Midnight (lãi suất cố định) trên các thị trường mà ứng dụng Morpho liệt kê, với ngưỡng từ ${formatDecimal("vi", morphoMin)}. Khoản vay lãi suất cố định còn nhận lời nhắc trước ngày đáo hạn. Cùng một gói áp dụng cho cả hai: hãy mở `,
          links.morphoDashboard("bảng điều khiển Morpho"),
          ".",
        ),
      },
      {
        question: "Nếu cảnh báo không đến thì sao?",
        answer: rich(
          `Lần kiểm tra tiếp theo, ${minutes} phút sau, sẽ thử lại. Việc gửi phụ thuộc vào Resend, một relay Signal,`,
          hasTelegram ? " Telegram Bot API," : "",
          " các node RPC công khai và trình lập lịch của Vercel, không có cam kết về thời gian hoạt động. Hãy chọn hai kênh và chừa thời gian để xử lý.",
        ),
      },
      {
        question: "Làm sao để dừng cảnh báo?",
        answer: rich(
          "Cảnh báo dừng khi hệ số sức khỏe của bạn trở lại trên ngưỡng, hoặc khi bạn xóa cảnh báo (cần quyền truy cập còn hiệu lực). Quyền truy cập đã hết hạn? Hãy nhắn cho chúng tôi trên ",
          links.x("X"),
          " hoặc trong cộng đồng của chúng tôi trên ",
          links.telegramCommunity("Telegram"),
          " hoặc ",
          links.signalCommunity("Signal"),
          ".",
          hasTelegram ? " Trong Telegram, lệnh /stop cũng dùng được." : "",
          " Hiện chưa có chức năng tạm hoãn và chưa có liên kết hủy đăng ký.",
        ),
      },
      {
        question: "Tôi có thể theo dõi một ví mà tôi không kết nối không?",
        answer: rich("Hiện tại thì chưa. Một ví, là ví bạn kết nối; quyền truy cập tính theo từng ví."),
      },
      {
        question: "Công cụ khác không tốn đồng nào. Vì sao phải trả tiền?",
        answer: rich(
          "Nếu một bot Telegram hay một ứng dụng di động phù hợp với bạn, hãy dùng nó",
          links.comparison ? rich(": ", links.comparison("bài so sánh của chúng tôi"), " có điểm qua chúng") : null,
          ". Tokenping dành cho cảnh báo qua Signal hoặc email, trên mọi thị trường Aave và mọi thị trường Morpho được liệt kê.",
        ),
      },
    ];
  },

  limitsTitle: "Các giới hạn, nói thẳng",
  limits: ({ minutes, paymentChain }) => [
    `Kiểm tra ${viEveryMinutes(minutes)}, không liên tục.`,
    "Mỗi lần kiểm tra dưới ngưỡng sẽ gửi thêm một tin nhắn: không có tạm hoãn hay bản tóm tắt.",
    "Một ngưỡng cho mỗi thị trường, chỉ cho ví đã kết nối.",
    `Chỉ USDC${paymentChain ? ` trên mạng ${paymentChain}` : ""}: không dùng thẻ, không hoàn tiền.`,
    "Email chưa có liên kết hủy đăng ký; xóa cảnh báo cần quyền truy cập còn hiệu lực.",
    "Beta: gửi qua bên thứ ba, không cam kết về thời gian hoạt động.",
  ],

  blogTitle: "Từ blog",
  allGuides: "Mọi bài hướng dẫn về Aave và Morpho",

  closingTitle: "Cài đặt cảnh báo hệ số sức khỏe trên Aave hoặc Morpho",
  closingLead: alertPrice => `${capitalize(alertPrice)}, thanh toán từ ví của bạn. Không tự động gia hạn.`,
};
