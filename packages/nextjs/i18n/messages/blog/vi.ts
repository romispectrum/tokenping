import type { BlogMessages } from "./shared";

/** "mỗi 5 phút", "mỗi phút": the noun does not change with the count. */
const viEveryMinutes = (minutes: number) => (minutes === 1 ? "mỗi phút" : `mỗi ${minutes} phút`);

export const MESSAGES: BlogMessages = {
  crumbs: { home: "Trang chủ", blog: "Blog" },
  index: {
    title: "Hướng dẫn về hệ số sức khỏe và thanh lý trên Aave và Morpho",
    description:
      "Bài hướng dẫn về hệ số sức khỏe, thanh lý, giá thanh lý và cảnh báo trên Aave và Morpho, có ví dụ tính toán và số liệu ghi rõ ngày, nguồn.",
    kicker: "Bài hướng dẫn về Aave và Morpho",
    lead: "Hệ số sức khỏe hoạt động thế nào trên Aave và trên Morpho, điều gì xảy ra khi bị thanh lý, cách tính giá thanh lý của bạn và cách nhận cảnh báo trước khi giá đến gần mức đó. Mọi số liệu trong các bài hướng dẫn này đều ghi nguồn và ngày được kiểm tra.",
    dashboardCta: "Mở bảng điều khiển Aave",
    morphoDashboardCta: "Mở bảng điều khiển Morpho",
    rss: "Theo dõi qua RSS",
    startHere: "Bắt đầu từ đây",
    allGuides: "Tất cả bài hướng dẫn",
    empty: {
      title: "Chưa có bài hướng dẫn",
      description:
        "Chúng tôi đang chuẩn bị các bài hướng dẫn bằng tiếng Việt. Theo dõi qua RSS để nhận bài khi được đăng.",
      otherLanguage: "Đọc các bài hướng dẫn bằng tiếng Anh",
    },
  },
  post: {
    kicker: "Hướng dẫn Aave V3",
    morphoKicker: "Hướng dẫn Morpho",
    byline: { author: "Đội ngũ Tokenping", published: "Đăng ngày", updated: "Cập nhật ngày" },
    readingTime: minutes => `${minutes} phút đọc`,
    readGuide: "Đọc bài hướng dẫn",
    related: "Bài hướng dẫn liên quan",
  },
  endBox: {
    label: "Về Tokenping",
    title: "Cảnh báo hệ số sức khỏe từ Tokenping",
    body: ({ minutes, networks, channels, price, paymentChain }) =>
      `Tokenping kiểm tra hệ số sức khỏe Aave V3 và V4 của bạn ${viEveryMinutes(minutes)} trên ${networks} mạng và nhắn tin cho bạn qua ${channels} khi hệ số này dưới ngưỡng của bạn. Cảnh báo tốn ${price}${paymentChain ? `, thanh toán trên mạng ${paymentChain}` : ""}; xem vị thế không cần thanh toán. Cảnh báo cho bạn thời gian để hành động; chúng không ngăn được việc thanh lý.`,
    cta: "Mở bảng điều khiển",
    morpho: {
      title: "Cảnh báo hệ số sức khỏe Morpho từ Tokenping",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tokenping kiểm tra hệ số sức khỏe Morpho Blue và Midnight của bạn ${viEveryMinutes(minutes)} trên ${networks} mạng và nhắn tin cho bạn qua ${channels} khi hệ số này dưới ngưỡng của bạn, kèm lời nhắc trước ngày đáo hạn của khoản vay lãi suất cố định. Cảnh báo tốn ${price}${paymentChain ? `, thanh toán trên mạng ${paymentChain}` : ""}, cùng gói với cảnh báo Aave; xem vị thế không cần thanh toán. Cảnh báo cho bạn thời gian để hành động; chúng không ngăn được việc thanh lý.`,
      cta: "Mở bảng điều khiển Morpho",
    },
  },
  alertPrice: {
    fallback: "một khoản phí nhỏ bằng USDC (xem giá hiện tại trên bảng điều khiển)",
    plan: ({ priceLabel, days }) => `${priceLabel} cho ${days} ngày`,
  },
  callout: { info: "Ghi chú", warning: "Cảnh báo" },
  shortAnswer: "Trả lời ngắn",
  scopeNote: {
    text: "Áp dụng cho Aave V3.7, đã kiểm tra trên các thị trường Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche và Gnosis. Các thị trường và mạng V3 khác có thể chạy phiên bản cũ hơn. Những điểm khác biệt của Aave V4 được ghi chú ở những chỗ quy tắc khác nhau.",
    morphoText:
      "Áp dụng cho các thị trường Morpho Blue và Morpho Midnight được liệt kê trong ứng dụng Morpho. Mỗi thị trường tự đặt tài sản thế chấp, oracle và LLTV của riêng mình, vì vậy hãy kiểm tra số liệu của thị trường bạn dùng.",
    figuresAsOf: "Số liệu tính đến ngày",
  },
  table: {
    fallbackLabel: "Bảng, cuộn theo chiều ngang",
    label: (heading, index) => (index === undefined ? `Bảng: ${heading}` : `Bảng ${index}: ${heading}`),
    scrollHint: "Cuộn ngang để xem tất cả các cột.",
  },
};
