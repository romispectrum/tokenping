import type { AlertsMessages } from "./shared";
import { viMarket } from "~~/i18n/format";

const ATTRIBUTION_QUESTION = "Bạn biết đến Tokenping qua đâu?";

/** The email badge's word, written in lower case in running text ("qua email"). */
const VI_EMAIL_BADGE = "Email";

export const MESSAGES: AlertsMessages = {
  cardTitle: "Cài đặt cảnh báo",
  active: "Đang bật",
  payToEdit: "Thanh toán quyền truy cập để chỉnh sửa",
  editAlert: "Sửa cảnh báo",
  signInTitle: "Đăng nhập để quản lý cảnh báo",
  signInDescription:
    "Ví của bạn ký một tin nhắn để chứng minh địa chỉ này là của bạn. Đây không phải giao dịch và không tốn gas.",
  signIn: "Đăng nhập bằng ví",
  signingIn: "Đang chờ ví của bạn",
  signInStatement: "Đăng nhập vào Tokenping để xem và sửa cảnh báo hệ số sức khỏe của bạn.",
  signInRejected: "Bạn đã từ chối yêu cầu ký. Hãy đăng nhập để xem và sửa cảnh báo.",
  signInFailed: "Không thể đăng nhập. Hãy thử lại.",
  signInExpired: "Phiên đăng nhập của bạn đã hết. Hãy đăng nhập lại bằng ví.",
  emptyTitle: (chainName, kind) => `Chưa có cảnh báo nào trên ${viMarket(chainName, kind)}`,
  emptyDescription: "Nhận tin nhắn khi hệ số sức khỏe của bạn giảm xuống dưới ngưỡng bạn chọn.",
  createAlert: "Tạo cảnh báo",
  loadErrorTitle: "Không tải được cài đặt cảnh báo",
  loadErrorDescription: "Hãy kiểm tra kết nối rồi thử lại.",
  tryAgain: "Thử lại",
  retrying: "Đang thử lại",
  servicesLegend: "Kênh cảnh báo",
  servicesDescription: "Chọn nơi nhận cảnh báo. Bạn có thể chọn nhiều kênh.",
  serviceNames: { email: VI_EMAIL_BADGE, signal: "Signal", telegram: "Telegram" },
  emailLabel: "Địa chỉ email",
  emailDescription: "Cảnh báo được gửi đến địa chỉ này.",
  emailPlaceholder: "ten@example.com",
  signalLabel: "Tên người dùng Signal",
  signalDescription: "Trong Signal, mở Cài đặt, rồi Hồ sơ. Tên có dạng alice.42.",
  telegramLabel: "Tên người dùng Telegram",
  telegramDescription:
    "Cảnh báo được gửi đến tài khoản Telegram này. Tìm tên người dùng trong Telegram ở Cài đặt, rồi Tên người dùng.",
  telegramPlaceholder: "alice_eth",
  telegramChecking: "Đang kiểm tra",
  telegramLinked: username => `@${username} đã được liên kết: cảnh báo sẽ đến cuộc trò chuyện Telegram của bạn.`,
  telegramPressStart: bot => `Chưa liên kết: hãy nhấn Start trong ${bot ? `@${bot}` : "bot Tokenping"} một lần.`,
  openBot: bot => `Mở @${bot}`,
  telegramStatusUnknown: "Không kiểm tra được tên người dùng này đã liên kết hay chưa. Bạn vẫn có thể lưu.",
  opensInNewTab: "(mở trong thẻ mới)",
  channelLanguageLabels: { email: "Ngôn ngữ email", signal: "Ngôn ngữ Signal", telegram: "Ngôn ngữ Telegram" },
  thresholdLabel: "Ngưỡng hệ số sức khỏe",
  thresholdExactValue: "(giá trị chính xác)",
  thresholdScale: { critical: "Nguy cấp", safe: "An toàn", verySafe: "Rất an toàn" },
  thresholdDescription: (threshold, chainName, kind) =>
    `Bạn sẽ nhận được thông báo khi hệ số sức khỏe của bạn trên ${viMarket(chainName, kind)} giảm xuống dưới ${threshold}.`,
  saveAlert: "Lưu cảnh báo",
  saving: "Đang lưu",
  cancel: "Hủy",
  deleteAlert: "Xóa cảnh báo",
  deleting: "Đang xóa",
  keepAlert: "Giữ cảnh báo",
  deleteTitle: "Xóa cảnh báo này?",
  deleteDescription: (chainName, kind) =>
    `Tokenping sẽ ngừng gửi cảnh báo hệ số sức khỏe cho ${viMarket(chainName, kind)}.`,
  // Vietnamese nouns do not change after a number.
  errorSummaryTitle: count => `Sửa ${count} trường để lưu`,
  formErrors: {
    noService: "Hãy chọn ít nhất một kênh cảnh báo.",
    noEmail: "Hãy nhập địa chỉ email của bạn.",
    invalidEmail: "Hãy nhập địa chỉ email có dạng ten@example.com.",
    noSignal: "Hãy nhập tên người dùng Signal của bạn.",
    invalidSignal:
      "Hãy nhập tên người dùng Signal có dạng alice.42. Tìm tên của bạn trong Signal ở Cài đặt, rồi Hồ sơ.",
    noTelegram: "Hãy nhập tên người dùng Telegram của bạn.",
    invalidTelegram:
      "Hãy nhập tên người dùng Telegram có dạng alice_eth: từ 4 đến 32 chữ cái, chữ số hoặc dấu gạch dưới, bắt đầu bằng chữ cái và không kết thúc bằng _.",
  },
  summaryServices: "Kênh",
  summaryNoServices: "Chưa chọn kênh nào",
  summaryEmail: "Email",
  summarySignal: "Signal",
  summaryTelegram: "Telegram",
  summaryLanguage: "Ngôn ngữ",
  summaryTelegramNotLinked: bot => `Chưa liên kết: hãy nhấn Start trong @${bot} một lần.`,
  summaryThreshold: "Ngưỡng",
  sendTest: "Gửi thử",
  sendingTest: "Đang gửi",
  testAgainIn: minutes => `Gửi lại sau ${minutes} phút`,
  testSent: channel =>
    `Đã gửi tin nhắn thử qua ${channel === VI_EMAIL_BADGE ? "email" : channel}. Hãy kiểm tra xem tin nhắn đã đến chưa.`,
  testFailed: "Không gửi được tin nhắn thử",
  testLimitNote: minutes =>
    `Tin nhắn thử gửi cảnh báo này và vị thế của bạn như hiện tại. Mỗi kênh được gửi thử một lần mỗi ${minutes} phút.`,
  belowThresholdTitle: "Dưới ngưỡng cảnh báo của bạn",
  belowThresholdDescription: (healthFactor, threshold) =>
    `Hệ số sức khỏe hiện tại của bạn (${healthFactor}) đang dưới ngưỡng ${threshold} của bạn.`,
  alertSaved: "Đã lưu cảnh báo",
  saveFailed: "Không lưu được cảnh báo của bạn",
  alertDeleted: "Đã xóa cảnh báo",
  deleteFailed: "Không xóa được cảnh báo của bạn",
  attributionQuestion: ATTRIBUTION_QUESTION,
  attributionFormLabel: `${ATTRIBUTION_QUESTION} (không bắt buộc)`,
  attributionDescription: "Giúp chúng tôi biết kênh nào hiệu quả. Được lưu cùng địa chỉ ví của bạn.",
  attributionEmpty: "Hãy nhập câu trả lời, hoặc chọn Bỏ qua.",
  // The checks behind it (length, hidden control characters) only fail for pasted text.
  attributionInvalid: () => "Câu trả lời quá dài hoặc chứa ký tự ẩn. Hãy nhập lại rồi thử lại.",
  attributionSendFailed: "Không gửi được câu trả lời. Hãy thử lại hoặc bỏ qua.",
  sendAnswer: "Gửi câu trả lời",
  sending: "Đang gửi",
  skip: "Bỏ qua",
  answerSent: "Đã gửi câu trả lời",
};
