import type { TelegramReplies } from "./shared";

export const MESSAGES: TelegramReplies = {
  privateChatsOnly: "Tokenping chỉ hoạt động trong cuộc trò chuyện riêng. Hãy nhắn tin trực tiếp cho bot.",
  noUsername:
    "Tài khoản Telegram của bạn chưa có tên người dùng. Hãy đặt một tên trong Telegram (Cài đặt, rồi Tên người " +
    "dùng), nhập tên đó vào cảnh báo của bạn trên Tokenping, rồi gửi lại /start tại đây.",
  linkSaveFailed: "Đã xảy ra lỗi khi liên kết cuộc trò chuyện này. Hãy gửi lại /start.",
  linked: username =>
    `Đã liên kết @${username}. Các cảnh báo Tokenping ghi @${username} sẽ đến cuộc trò chuyện này.\n\n` +
    "Gửi /stop bất cứ lúc nào để dừng nhận.",
  unsubscribed: "Đã dừng. Sẽ không còn cảnh báo Tokenping nào đến đây nữa. Gửi /start để nhận lại.",
  unsubscribeFailed: "Đã xảy ra lỗi khi dừng cảnh báo. Hãy gửi lại /stop.",
  help:
    "Tokenping nhắn tin cho bạn khi hệ số sức khỏe Aave hoặc Morpho của bạn giảm xuống dưới ngưỡng bạn đặt trong ứng dụng.\n\n" +
    "Nhập tên người dùng Telegram của bạn vào cảnh báo trên Tokenping, rồi gửi /start tại đây một lần.\n\n" +
    "Lệnh:\n" +
    "/start: liên kết cuộc trò chuyện này với tên người dùng của bạn\n" +
    "/stop: dừng mọi cảnh báo Tokenping tại đây\n" +
    "/help: hiện tin nhắn này",
  unknownCommand: "Tôi chỉ phản hồi /start, /stop và /help. Hãy quản lý cảnh báo trong ứng dụng Tokenping.",
};
