export interface KnowledgeTemplate {
  title: string;
  content: string;
  category: string;
  keywords: string;
}

export const DEFAULT_TEMPLATES: KnowledgeTemplate[] = [
  {
    title: "Giờ làm việc",
    content:
      "Bắc Trung Hải Logistics làm việc từ Thứ 2 đến Thứ 7, từ 8:00 sáng đến 17:30 chiều.\n" +
      "Chủ nhật và ngày lễ nghỉ. Quý khách vui lòng liên hệ trong giờ hành chính để được hỗ trợ nhanh nhất.",
    category: "Thông tin chung",
    keywords: "giờ làm việc, mấy giờ, thời gian mở cửa, giờ hành chính, lịch làm việc",
  },
  {
    title: "Thông tin liên hệ",
    content:
      "Bắc Trung Hải Logistics\n" +
      "Hotline: Vui lòng liên hệ nhân viên chăm sóc khách hàng.\n" +
      "Email: Liên hệ qua Zalo OA hoặc nhân viên phụ trách.\n" +
      "Website: https://thue.eu.cc\n" +
      "Zalo OA: Nhắn tin trực tiếp tại đây để được hỗ trợ.",
    category: "Liên hệ & hỗ trợ",
    keywords: "liên hệ, hotline, số điện thoại, email, zalo, địa chỉ",
  },
  {
    title: "Cách tạo đơn hàng",
    content:
      "Để tạo đơn hàng mới:\n" +
      "1. Đăng nhập vào hệ thống tại https://thue.eu.cc\n" +
      "2. Nhấn \"Tạo đơn hàng\"\n" +
      "3. Dán link sản phẩm từ Taobao, 1688, Tmall hoặc các sàn TMĐT Trung Quốc\n" +
      "4. Nhập số lượng, ghi chú (nếu có)\n" +
      "5. Xác nhận đơn hàng\n\n" +
      "Hệ thống sẽ tính toán chi phí tự động. Nhân viên sẽ xử lý đơn trong giờ làm việc.",
    category: "Hướng dẫn sử dụng",
    keywords: "tạo đơn, đặt hàng, mua hàng, order, đơn hàng mới, cách đặt",
  },
  {
    title: "Cách kiểm tra đơn hàng",
    content:
      "Quý khách có thể kiểm tra trạng thái đơn hàng bằng cách:\n" +
      "1. Đăng nhập vào hệ thống → xem danh sách đơn hàng\n" +
      "2. Gửi mã đơn hàng qua Zalo OA → hệ thống trả lời tự động\n\n" +
      "Các trạng thái đơn hàng:\n" +
      "• Chờ mua: Đơn đang chờ nhân viên mua hộ\n" +
      "• Đã mua: Đã mua hàng từ người bán\n" +
      "• Đang vận chuyển: Hàng đang trên đường từ Trung Quốc về Việt Nam\n" +
      "• Tới kho VN: Hàng đã về kho Việt Nam\n" +
      "• Hoàn thành: Đã giao hàng cho khách",
    category: "Hướng dẫn sử dụng",
    keywords: "kiểm tra đơn, trạng thái, tracking, theo dõi đơn, đơn hàng ở đâu, mã đơn",
  },
  {
    title: "Cách nạp tiền",
    content:
      "Quý khách nạp tiền vào ví bằng cách chuyển khoản ngân hàng:\n" +
      "1. Liên hệ nhân viên để nhận thông tin tài khoản ngân hàng\n" +
      "2. Chuyển khoản với nội dung: [Tên đăng nhập] nạp tiền\n" +
      "3. Gửi ảnh chụp biên lai cho nhân viên qua Zalo\n" +
      "4. Nhân viên xác nhận và cộng tiền vào ví trong vòng 15-30 phút (trong giờ làm việc)\n\n" +
      "Số dư ví sẽ tự động trừ khi đơn hàng hoàn thành giao hàng.",
    category: "Hướng dẫn sử dụng",
    keywords: "nạp tiền, chuyển khoản, thanh toán, ví tiền, số dư, cách trả tiền",
  },
  {
    title: "Cách tính phí",
    content:
      "Chi phí đơn hàng được tính như sau:\n" +
      "• Giá hàng: Giá CNY × Tỷ giá quy đổi\n" +
      "• Phí dịch vụ: Tính theo giá trị đơn hàng\n" +
      "• Phí vận chuyển: Tính theo cân nặng thực tế (kg)\n\n" +
      "Tổng chi phí = Giá hàng + Phí dịch vụ + Phí vận chuyển\n\n" +
      "Tỷ giá và phí vận chuyển được cập nhật hàng ngày. Quý khách xem chi tiết khi tạo đơn hàng.",
    category: "Chính sách & phí",
    keywords: "tính phí, phí vận chuyển, giá, tỷ giá, bao nhiêu tiền, chi phí, phí ship",
  },
  {
    title: "Quy trình vận chuyển",
    content:
      "Quy trình vận chuyển hàng từ Trung Quốc về Việt Nam:\n" +
      "1. Đặt hàng → Nhân viên mua hàng từ sàn TMĐT Trung Quốc\n" +
      "2. Hàng về kho Trung Quốc → Kiểm tra, cân nặng, đóng gói\n" +
      "3. Vận chuyển về Việt Nam → Thường 5-10 ngày làm việc (đường bộ)\n" +
      "4. Hàng về kho Việt Nam → Thông báo cho khách\n" +
      "5. Giao hàng → Phát hàng tại kho hoặc gửi qua đơn vị vận chuyển nội địa\n\n" +
      "Thời gian vận chuyển có thể thay đổi tùy theo tình hình thực tế.",
    category: "Thông tin chung",
    keywords: "vận chuyển, ship, giao hàng, bao lâu, mấy ngày, thời gian giao, quy trình",
  },
  {
    title: "Khiếu nại / hỗ trợ",
    content:
      "Nếu quý khách gặp vấn đề với đơn hàng (hàng thiếu, hàng lỗi, sai hàng):\n" +
      "1. Chụp ảnh/quay video sản phẩm lỗi\n" +
      "2. Gửi kèm mã đơn hàng cho nhân viên qua Zalo\n" +
      "3. Nhân viên sẽ xác minh và phản hồi trong vòng 24 giờ làm việc\n\n" +
      "Chúng tôi cam kết hỗ trợ giải quyết mọi vấn đề phát sinh trong quá trình vận chuyển.",
    category: "Liên hệ & hỗ trợ",
    keywords: "khiếu nại, hỗ trợ, hàng lỗi, hàng thiếu, sai hàng, bồi thường, phản ánh",
  },
  {
    title: "Địa chỉ kho Trung Quốc",
    content:
      "Địa chỉ kho nhận hàng tại Trung Quốc:\n" +
      "Vui lòng liên hệ nhân viên để nhận địa chỉ kho chính xác.\n\n" +
      "Lưu ý khi gửi hàng về kho:\n" +
      "• Ghi rõ mã khách hàng / tên đăng nhập trên kiện hàng\n" +
      "• Thông báo cho nhân viên khi đã gửi hàng về kho\n" +
      "• Không gửi hàng cấm theo quy định pháp luật Việt Nam và Trung Quốc",
    category: "Thông tin chung",
    keywords: "kho trung quốc, địa chỉ kho TQ, kho china, gửi hàng, nhận hàng",
  },
  {
    title: "Địa chỉ kho Việt Nam",
    content:
      "Địa chỉ kho nhận hàng tại Việt Nam:\n" +
      "Vui lòng liên hệ nhân viên để nhận địa chỉ kho và giờ phát hàng.\n\n" +
      "Khi đến nhận hàng, quý khách cần:\n" +
      "• Mang theo CMND/CCCD\n" +
      "• Cung cấp mã đơn hàng hoặc tên đăng nhập\n" +
      "• Kiểm tra hàng trước khi nhận",
    category: "Thông tin chung",
    keywords: "kho việt nam, địa chỉ kho VN, nhận hàng, phát hàng, lấy hàng ở đâu",
  },
];
