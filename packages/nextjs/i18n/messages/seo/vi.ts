import { type SeoMessages, minutes, networks } from "./shared";

export const MESSAGES: SeoMessages = {
  defaultTitle: "Tokenping: cảnh báo hệ số sức khỏe trên Aave và Morpho",
  defaultDescription: `Cảnh báo khi hệ số sức khỏe Aave hoặc Morpho của bạn giảm xuống dưới ngưỡng bạn chọn, trên ${networks} mạng, kiểm tra mỗi ${minutes} phút.`,
  organizationDescription:
    "Tokenping gửi tin nhắn khi hệ số sức khỏe của một vị thế trên Aave V3, Aave V4, Morpho Blue hoặc Morpho Midnight giảm xuống dưới ngưỡng mà chủ vị thế đã đặt.",
  siteOgAlt: title => `${title} (Tokenping)`,
  rssTitle: "Blog Tokenping (tiếng Việt)",
  postOgAlt: title => `${title} (bài hướng dẫn Aave V3 của Tokenping)`,
  morphoPostOgAlt: title => `${title} (bài hướng dẫn Morpho của Tokenping)`,
  siteOgTitle: channels => `Cảnh báo hệ số sức khỏe trên Aave và Morpho qua ${channels}`,
  siteOgFooter: "Tokenping · Aave và Morpho",
  postOgFooter: "Tokenping · bài hướng dẫn Aave V3",
  morphoPostOgFooter: "Tokenping · bài hướng dẫn Morpho",
};
