import type { PrivacyMessages } from "./shared";

const ATTRIBUTION_QUESTION_VI = '"Bạn biết đến Tokenping qua đâu?"';

export const MESSAGES: PrivacyMessages = {
  metaTitle: "Quyền riêng tư và dữ liệu",
  metaDescription:
    "Tokenping lưu gì khi bạn cài đặt cảnh báo hệ số sức khỏe Aave, không lưu gì, dịch vụ nào xử lý dữ liệu của bạn và cách xóa dữ liệu.",
  crumbHome: "Trang chủ",
  crumbPrivacy: "Quyền riêng tư",
  title: "Quyền riêng tư: Tokenping lưu gì và ai xử lý dữ liệu",
  lastUpdated: "Cập nhật lần cuối ngày",
  intro:
    "Trang này mô tả những gì ứng dụng làm hiện nay. Tokenping đang ở giai đoạn beta, và chúng tôi cập nhật trang này khi những gì chúng tôi thu thập thay đổi.",
  withoutUs: {
    title: "Những gì bạn có thể làm mà không cần cung cấp gì cho chúng tôi",
    text: "Đọc trang web và blog, và xem vị thế của bạn trên bảng điều khiển, không thêm gì vào cơ sở dữ liệu của chúng tôi. Để hiển thị vị thế của bạn, trình duyệt của bạn hỏi các nhà cung cấp RPC (liệt kê bên dưới) về dữ liệu Aave của ví bạn, nên họ thấy địa chỉ ví của bạn.",
    morpho:
      "Trên bảng điều khiển Morpho, trình duyệt của bạn còn gửi địa chỉ ví của bạn đến API của Morpho (API này tìm các thị trường Morpho mà bạn đang vay), và đọc các vị thế Morpho của bạn từ cùng các nhà cung cấp RPC đó.",
  },
  stored: {
    title: "Những gì chúng tôi lưu khi bạn lưu một cảnh báo",
    items: [
      "Địa chỉ ví của bạn.",
      "Mạng mà cảnh báo áp dụng, và ngưỡng của bạn.",
      "Các kênh bạn đã chọn, và ngôn ngữ của từng kênh.",
      "Địa chỉ email của bạn, nếu bạn chọn email.",
      "Tên người dùng Signal của bạn, nếu bạn chọn Signal.",
      "Thời điểm cảnh báo được tạo và được thay đổi lần cuối.",
      "Thời điểm bạn gửi tin nhắn thử lần cuối trên mỗi kênh, để cho phép một lần gửi thử trên mỗi kênh trong mỗi 15 phút.",
    ],
    telegram:
      "Nếu bạn chọn Telegram, chúng tôi lưu tên người dùng Telegram mà bạn nhập vào cảnh báo. Khi tài khoản đó nhấn Start trong bot Tokenping, chúng tôi còn lưu ID cuộc trò chuyện (chat ID) của tài khoản đó và thời điểm nó nhấn Start, để cảnh báo có thể đến được tài khoản đó. Bất kỳ ai cũng có thể kiểm tra xem một tên người dùng Telegram đã nhấn Start trong bot hay chưa.",
    attribution: `Nếu bạn trả lời câu hỏi không bắt buộc ${ATTRIBUTION_QUESTION_VI} sau khi lưu một cảnh báo, chúng tôi lưu câu trả lời của bạn và thời điểm trả lời cùng với địa chỉ ví của bạn.`,
  },
  notStored: {
    title: "Những gì chúng tôi không lưu",
    items: [
      "Vị thế của bạn hay lịch sử hệ số sức khỏe của bạn. Chúng được đọc trực tiếp mỗi lần và không được lưu lại.",
      "Nhật ký các cảnh báo chúng tôi đã gửi.",
      `Pixel theo dõi hay cookie quảng cáo: trang web không dùng loại nào. Khi bạn đăng nhập bằng ví, Tokenping đặt một cookie chỉ cho biết ví nào đã đăng nhập; cookie này tồn tại 7 ngày hoặc cho đến khi bạn ngắt kết nối ví trên trang web này. Trong lúc bạn đăng nhập, một cookie thứ hai giữ yêu cầu đăng nhập trong năm phút. Trình duyệt của bạn giữ trong bộ nhớ cục bộ (local storage) của chính nó: giao diện (theme) bạn chọn, kết nối ví của bạn, những ví nào đã đăng nhập trên trình duyệt đó và việc trình duyệt đã hiển thị câu hỏi ${ATTRIBUTION_QUESTION_VI} cho bạn hay chưa.`,
      "Địa chỉ IP trong cơ sở dữ liệu của chúng tôi. Dù vậy, Vercel vẫn xử lý mọi yêu cầu, như liệt kê bên dưới. Khi một lần kiểm tra cảnh báo hoặc một tin nhắn bị lỗi, thông báo lỗi, có thể bao gồm địa chỉ ví của bạn và người nhận, được ghi vào nhật ký máy chủ (server log) của chúng tôi.",
    ],
  },
  whoCanSee: {
    title: "Ai có thể xem cài đặt cảnh báo của bạn",
    tiedToWallet:
      "Cài đặt cảnh báo gắn với một địa chỉ ví, không gắn với một tài khoản có mật khẩu. Để xem hoặc thay đổi chúng, bạn ký một tin nhắn bằng ví đó, việc này chứng minh địa chỉ đó là của bạn. Đây không phải là giao dịch và không tốn phí gas, và một chữ ký có hiệu lực 7 ngày trên trình duyệt đó.",
    anyone: hasTelegram =>
      `Chỉ người có thể ký bằng ví của bạn mới xem được địa chỉ email${hasTelegram ? ", tên người dùng Signal và tên người dùng Telegram" : " và tên người dùng Signal"} đã lưu cho ví đó, hoặc thay đổi hay xóa các cảnh báo của ví đó. Dù vậy, các bản ghi thanh toán công khai được mô tả bên dưới vẫn cho thấy những ví nào đã thanh toán.`,
    dontEnter:
      "Đừng nhập địa chỉ email hoặc tên người dùng Signal mà bạn không muốn bị liên kết với địa chỉ ví của mình.",
  },
  processors: {
    title: "Ai xử lý dữ liệu của bạn",
    list: ({ minutes, hasTelegram }) => [
      {
        name: "Vercel",
        role: `Lưu trữ (host) trang web này và chạy việc kiểm tra cảnh báo mỗi ${minutes} phút.`,
        receives: "Mọi yêu cầu đến trang web, bao gồm địa chỉ IP của bạn, và nhật ký máy chủ của chúng tôi.",
      },
      {
        name: "Vercel Web Analytics",
        role: "Đếm lượt xem trang, không dùng cookie.",
        receives:
          "Với mỗi lượt xem trang: địa chỉ trang, trang web bạn đến từ đó, vị trí gần đúng của bạn, và trình duyệt, hệ điều hành và loại thiết bị của bạn. Một khách truy cập là một giá trị băm (hash) của yêu cầu, thay đổi sau mỗi 24 giờ, nên các lượt truy cập không thể được liên kết giữa các ngày hay giữa các trang web.",
      },
      {
        name: "Supabase",
        role: "Cơ sở dữ liệu của chúng tôi.",
        receives: "Các cài đặt cảnh báo được liệt kê ở trên.",
      },
      { name: "Resend", role: "Gửi email cảnh báo.", receives: "Địa chỉ email của bạn và nội dung cảnh báo." },
      {
        name: "Fly.io (máy chủ chuyển tiếp Signal của chúng tôi)",
        role: "Lưu trữ máy chủ signal-cli-rest-api do chúng tôi vận hành, máy chủ này chuyển cảnh báo Signal cho Signal.",
        receives: "Tên người dùng Signal của bạn và nội dung cảnh báo (Signal cũng nhận được những thông tin này).",
      },
      ...(hasTelegram
        ? [
            {
              name: "Telegram",
              role: "Gửi cảnh báo Telegram qua Bot API của Telegram.",
              receives: "ID cuộc trò chuyện Telegram của bạn và nội dung cảnh báo.",
            },
          ]
        : []),
      {
        name: "Nhà cung cấp RPC (PublicNode, Alchemy và các endpoint công khai của các mạng)",
        role: "Trả lời các yêu cầu đọc blockchain: từ trình duyệt của bạn cho bảng điều khiển, và từ máy chủ của chúng tôi cho việc kiểm tra cảnh báo và để kiểm tra chữ ký đăng nhập từ ví thông minh (smart wallet).",
        receives:
          "Địa chỉ ví đang được đọc (và, khi bạn đăng nhập, chữ ký của bạn), và địa chỉ IP của bạn với các yêu cầu đọc từ trình duyệt của bạn.",
      },
      {
        name: "API của Morpho",
        role: "Tìm các thị trường Morpho được liệt kê mà ví của bạn đang vay, cho bảng điều khiển Morpho, và cho máy chủ của chúng tôi biết một thị trường có được liệt kê hay không khi bạn lưu một cảnh báo Morpho.",
        receives: "Địa chỉ ví của bạn, và địa chỉ IP của bạn với các lần tra cứu do trình duyệt của bạn thực hiện.",
      },
      {
        name: "WalletConnect",
        role: "Chuyển tiếp kết nối giữa trang web này và ứng dụng ví của bạn, nếu bạn kết nối bằng WalletConnect.",
        receives:
          "Những gì ứng dụng ví của bạn và trang web này trao đổi để kết nối, chẳng hạn như địa chỉ ví của bạn.",
      },
    ],
    receives: receives => `Nhận: ${receives}`,
    ownPolicy: "Mỗi dịch vụ này xử lý dữ liệu đó theo chính sách quyền riêng tư của riêng mình.",
  },
  onChain: {
    title: "Những gì công khai trên blockchain",
    text: paymentChainName =>
      `Việc thanh toán cho cảnh báo diễn ra trên ${paymentChainName ? `mạng ${paymentChainName}` : "mạng thanh toán"}. Mỗi khoản thanh toán ghi lại địa chỉ thanh toán, token, số tiền, thời điểm, khoảng thời gian đã mua và ngày hết hạn mới trong một sự kiện (event) công khai mà ai cũng có thể đọc và không ai có thể xóa. Cài đặt cảnh báo của bạn không bao giờ được ghi lên blockchain.`,
  },
  retention: {
    title: "Chúng tôi giữ dữ liệu bao lâu, và cách xóa",
    settings:
      "Cài đặt cảnh báo được giữ cho đến khi bạn xóa cảnh báo trong bảng điều khiển. Việc xóa sẽ gỡ bỏ cài đặt của mạng đó, bao gồm địa chỉ email và tên người dùng Signal, và cần quyền truy cập còn hiệu lực.",
    telegramStop:
      "Gửi /stop cho bot Tokenping trong Telegram sẽ hủy liên kết cuộc trò chuyện của bạn và dừng cảnh báo qua Telegram.",
    contact: {
      before: `Nếu quyền truy cập của bạn đã hết hạn, hoặc bạn muốn xóa câu trả lời của mình cho câu hỏi ${ATTRIBUTION_QUESTION_VI}, hãy nhắn cho chúng tôi trên`,
      x: "X",
      middle: "hoặc trong cộng đồng của chúng tôi trên",
      telegram: "Telegram",
      or: "hoặc",
      signal: "Signal",
      after: "và chúng tôi sẽ xóa.",
    },
    payments: "Không ai có thể xóa các khoản thanh toán trên blockchain.",
  },
  homepage: {
    before: "Các câu hỏi về cách cảnh báo hoạt động được trả lời trên ",
    link: "trang chủ",
    after: ".",
  },
};
