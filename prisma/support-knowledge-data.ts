// 100+ real Vietnamese support knowledge entries for chatbot
// Covers 40 topic categories for Zalo / Telegram / Messenger auto-reply

export interface KnowledgeEntry {
  title: string;
  category: string;
  content: string;
}

export const supportKnowledgeEntries: KnowledgeEntry[] = [
  // ─── 1. Tạo đơn hàng ───
  {
    title: "Cách tạo đơn hàng mới",
    category: "Tạo đơn hàng",
    content:
      "Đăng nhập → bấm Tạo đơn hàng → dán link sản phẩm → nhập số lượng và ghi chú → hệ thống tự tính phí → bấm Xác nhận.\nNhân viên sẽ xử lý đơn trong vòng 1-2 giờ làm việc.",
  },
  {
    title: "Tạo đơn không có link sản phẩm được không",
    category: "Tạo đơn hàng",
    content:
      "Bạn cần có link sản phẩm từ Taobao, 1688 hoặc Tmall để tạo đơn. Nếu chưa có link, bạn gửi hình ảnh hoặc mô tả sản phẩm cho nhân viên qua Zalo, bên mình sẽ tìm giúp bạn.",
  },
  {
    title: "Tạo đơn xong bao lâu được xử lý",
    category: "Tạo đơn hàng",
    content:
      "Sau khi tạo đơn, nhân viên sẽ xác nhận và đặt hàng cho bạn trong vòng 1-2 giờ (trong giờ làm việc). Đơn tạo ngoài giờ sẽ được xử lý vào sáng hôm sau.",
  },

  // ─── 2. Link Taobao / 1688 / Tmall ───
  {
    title: "Lưu ý khi gửi link Taobao/1688/Tmall",
    category: "Link sản phẩm",
    content:
      "Khi tạo đơn, hãy dán link đầy đủ từ Taobao, 1688 hoặc Tmall.\n- Copy link từ thanh địa chỉ trình duyệt\n- Đảm bảo link bắt đầu bằng https://\n- Chọn đúng màu/size trước khi copy\n- Ghi chú thêm yêu cầu đặc biệt ở phần ghi chú",
  },
  {
    title: "Copy link sản phẩm từ app Taobao trên điện thoại",
    category: "Link sản phẩm",
    content:
      "Mở sản phẩm trên app Taobao → bấm nút Chia sẻ → chọn Sao chép liên kết → dán link đó vào phần tạo đơn. Nếu link quá dài cũng không sao, hệ thống vẫn nhận được.",
  },
  {
    title: "Khác nhau giữa Taobao, 1688 và Tmall",
    category: "Link sản phẩm",
    content:
      "Taobao: mua lẻ, nhiều shop nhỏ, giá linh hoạt.\n1688: mua sỉ, giá gốc nhà máy, thường yêu cầu số lượng tối thiểu.\nTmall: hàng chính hãng, giá cao hơn.\nBên mình ship được hàng từ cả 3 sàn.",
  },

  // ─── 3. Thời gian vận chuyển ───
  {
    title: "Hàng bao lâu thì về Việt Nam",
    category: "Thời gian vận chuyển",
    content:
      "Thời gian trung bình từ lúc kho TQ nhận hàng đến kho VN là 3-7 ngày, tuỳ tuyến đường và khối lượng. Mùa cao điểm (sale lớn, Tết) có thể lâu hơn 2-3 ngày.",
  },
  {
    title: "Ship từ Quảng Châu về Lạng Sơn mất bao lâu",
    category: "Thời gian vận chuyển",
    content:
      "Tuyến Quảng Châu - Lạng Sơn thường mất 3-5 ngày làm việc. Nếu hàng đi qua Bằng Tường thì nhanh hơn. Thời gian có thể thay đổi khi tắc biên hoặc ngày lễ.",
  },
  {
    title: "Tại sao hàng lâu hơn dự kiến",
    category: "Thời gian vận chuyển",
    content:
      "Hàng có thể chậm hơn vì:\n- Người bán gửi trễ\n- Tắc biên / hải quan kiểm tra\n- Mùa cao điểm (11/11, 12/12, Tết)\n- Thời tiết xấu\nBạn liên hệ nhân viên để kiểm tra cụ thể nhé.",
  },

  // ─── 4. Trạng thái kho Trung Quốc ───
  {
    title: "Hàng về kho Trung Quốc nghĩa là gì",
    category: "Trạng thái kho TQ",
    content:
      "Nghĩa là kho bên Trung Quốc đã nhận được hàng từ người bán. Nhân viên sẽ kiểm tra, cân nặng và đóng gói để chuẩn bị chuyển về Việt Nam. Thời gian xử lý tại kho thường từ 1-2 ngày.",
  },
  {
    title: "Hàng ở kho TQ bao lâu thì chuyển về",
    category: "Trạng thái kho TQ",
    content:
      "Hàng thường được xử lý và xuất kho trong 1-2 ngày làm việc sau khi nhận. Nếu đơn có nhiều món, kho sẽ đợi gom đủ rồi mới đóng kiện chung để tiết kiệm phí cho bạn.",
  },
  {
    title: "Kho TQ kiểm tra hàng những gì",
    category: "Trạng thái kho TQ",
    content:
      "Kho kiểm tra:\n- Số lượng đúng không\n- Hàng có bị hư hỏng bên ngoài không\n- Cân nặng thực tế\n- Chụp ảnh kiện hàng\nNếu phát hiện vấn đề, nhân viên sẽ liên hệ bạn ngay.",
  },

  // ─── 5. Trạng thái kho Việt Nam ───
  {
    title: "Hàng về kho Việt Nam thì làm gì tiếp",
    category: "Trạng thái kho VN",
    content:
      "Khi hàng về kho VN, bạn sẽ nhận thông báo. Lúc này bạn cần:\n- Đảm bảo tài khoản có đủ số dư\n- Xác nhận địa chỉ giao hàng\nNhân viên sẽ sắp xếp giao hàng trong 1-2 ngày làm việc.",
  },
  {
    title: "Hàng về kho VN bao lâu thì giao",
    category: "Trạng thái kho VN",
    content:
      "Sau khi hàng về kho VN và bạn đã thanh toán đủ, hàng sẽ được giao trong 1-2 ngày làm việc. Nội thành Lạng Sơn thường giao trong ngày, tỉnh khác chuyển qua đối tác vận chuyển.",
  },
  {
    title: "Có tự đến kho lấy hàng được không",
    category: "Trạng thái kho VN",
    content:
      "Được bạn ơi! Bạn có thể đến kho Lạng Sơn lấy hàng trực tiếp trong giờ làm việc (T2-T7, 8:00-17:30). Nhớ mang theo mã đơn hàng hoặc CMND/CCCD để nhân viên đối chiếu nhé.",
  },

  // ─── 6. Quy trình giao hàng ───
  {
    title: "Quy trình giao hàng tận nơi",
    category: "Giao hàng",
    content:
      "Hàng về kho VN → nhân viên kiểm tra → đóng gói → giao qua đối tác vận chuyển hoặc nhân viên giao trực tiếp (nội thành). Bạn sẽ nhận thông báo khi hàng được giao đi.",
  },
  {
    title: "Giao hàng có gọi trước không",
    category: "Giao hàng",
    content:
      "Có, nhân viên hoặc đối tác vận chuyển sẽ gọi cho bạn trước khi giao. Hãy để số điện thoại luôn liên lạc được. Nếu không nghe máy, shipper sẽ giao lại lần sau.",
  },
  {
    title: "Giao hàng đi HCM hoặc Hà Nội được không",
    category: "Giao hàng",
    content:
      "Được bạn. Bên mình giao hàng toàn quốc qua đối tác vận chuyển. Nội thành Lạng Sơn giao trực tiếp, tỉnh thành khác chuyển qua Viettel Post hoặc GHTK. Phí giao hàng sẽ được tính vào đơn.",
  },

  // ─── 7. Tính cân nặng và phí ───
  {
    title: "Cách tính phí cân nặng",
    category: "Cân nặng & phí",
    content:
      "Phí vận chuyển quốc tế = Cân nặng (kg) × Đơn giá/kg.\nVí dụ: hàng 2kg, đơn giá 35.000đ/kg → Phí = 70.000đ.\nCân nặng được xác nhận khi kho TQ nhận và cân hàng.",
  },
  {
    title: "Tại sao cân nặng khác với bên bán nói",
    category: "Cân nặng & phí",
    content:
      "Cân nặng bên bán thường là cân sản phẩm chưa đóng gói. Kho bên mình cân cả hộp, xốp chống sốc, túi bọc — nên nặng hơn một chút. Cân nặng kho TQ là cân chính xác cuối cùng.",
  },
  {
    title: "Phí dịch vụ là gì",
    category: "Cân nặng & phí",
    content:
      "Phí dịch vụ là % trên giá trị đơn hàng (tính bằng VNĐ). Phí này bao gồm chi phí đặt hàng, kiểm tra và xử lý đơn. Tỷ lệ cụ thể được hiển thị khi bạn tạo đơn.",
  },
  {
    title: "Tỷ giá NDT hôm nay bao nhiêu",
    category: "Cân nặng & phí",
    content:
      "Tỷ giá NDT (CNY) sang VNĐ được cập nhật hàng ngày trong hệ thống. Bạn xem tỷ giá hiện tại khi tạo đơn hàng hoặc liên hệ nhân viên để hỏi. Tỷ giá thường dao động quanh 3.400-3.600 VNĐ/CNY.",
  },

  // ─── 8. Ví tiền / nạp tiền ───
  {
    title: "Cách nạp tiền vào ví",
    category: "Ví tiền & nạp tiền",
    content:
      "Chuyển khoản đến tài khoản Vietinbank CN Lạng Sơn: 110003049134.\nNội dung chuyển khoản: [Mã khách hàng] nạp tiền.\nSố dư sẽ được cập nhật trong 15 phút (giờ làm việc).",
  },
  {
    title: "Nạp tiền bao lâu thì cập nhật",
    category: "Ví tiền & nạp tiền",
    content:
      "Trong giờ làm việc: 15-30 phút.\nNgoài giờ làm việc: sáng hôm sau.\nNếu quá lâu chưa thấy cập nhật, bạn gửi ảnh chụp biên lai chuyển khoản cho nhân viên qua Zalo để kiểm tra nhé.",
  },
  {
    title: "Nạp nhầm số tiền thì sao",
    category: "Ví tiền & nạp tiền",
    content:
      "Không sao bạn ơi. Số tiền nạp vào ví sẽ dùng được cho các đơn hàng sau. Nếu nạp thừa nhiều và muốn rút lại, hãy liên hệ nhân viên để xử lý.",
  },

  // ─── 9. Thanh toán đơn ───
  {
    title: "Khi nào bị trừ tiền",
    category: "Thanh toán",
    content:
      "Hệ thống tự động trừ tiền từ ví khi đơn hàng hoàn thành giao hàng. Bạn không bị trừ tiền khi đơn mới tạo hoặc đang vận chuyển.",
  },
  {
    title: "Số dư không đủ thì sao",
    category: "Thanh toán",
    content:
      "Nếu ví không đủ tiền khi đơn hoàn thành, đơn sẽ được giữ lại và ghi nợ. Bạn cần nạp thêm tiền để thanh toán. Nạp sớm để hàng được giao nhanh hơn nhé!",
  },
  {
    title: "Thanh toán đơn hàng như thế nào",
    category: "Thanh toán",
    content:
      "Bạn nạp tiền vào ví trước, hệ thống sẽ tự trừ khi đơn hoàn thành. Không cần thanh toán từng đơn thủ công. Kiểm tra số dư ví trong phần Ví tiền trên hệ thống.",
  },

  // ─── 10. Hàng chậm cập nhật ───
  {
    title: "Vì sao chưa thấy đơn cập nhật",
    category: "Đơn chậm cập nhật",
    content:
      "Đơn có thể chưa cập nhật vì:\n- Người bán chưa gửi hàng\n- Hàng đang trên đường đến kho\n- Kho chưa xử lý kiện hàng\nNếu quá 3 ngày không cập nhật, hãy liên hệ nhân viên.",
  },
  {
    title: "Đơn hàng 5 ngày không cập nhật",
    category: "Đơn chậm cập nhật",
    content:
      "Nếu đơn quá 5 ngày không có cập nhật mới, bạn gửi mã đơn cho nhân viên qua Zalo hoặc Telegram. Bên mình sẽ kiểm tra trực tiếp với kho và phản hồi cho bạn.",
  },
  {
    title: "Trạng thái đơn bị kẹt ở Đã mua",
    category: "Đơn chậm cập nhật",
    content:
      "Trạng thái 'Đã mua' nghĩa là nhân viên đã đặt hàng với người bán. Hàng cần thời gian để người bán xử lý và gửi đi, thường 1-3 ngày. Nếu quá 5 ngày vẫn kẹt, liên hệ nhân viên nhé.",
  },

  // ─── 11. Không thấy tracking ───
  {
    title: "Không thấy mã tracking",
    category: "Tracking",
    content:
      "Mã tracking sẽ có sau khi người bán gửi hàng và cập nhật lên hệ thống. Thường mất 1-2 ngày sau khi đặt mua. Không phải tất cả đơn đều có tracking từ người bán.",
  },
  {
    title: "Mã tracking của tôi không tra được",
    category: "Tracking",
    content:
      "Mã tracking nội địa TQ chỉ tra được trên các trang vận chuyển Trung Quốc (SF Express, YTO, ZTO...). Bạn không cần tự tra, bên mình theo dõi và cập nhật trạng thái cho bạn trên hệ thống.",
  },

  // ─── 12. Khách gửi sai thông tin ───
  {
    title: "Gửi sai link sản phẩm",
    category: "Sai thông tin",
    content:
      "Nếu đơn chưa được mua, bạn liên hệ nhân viên ngay để sửa link. Nếu đã mua rồi thì không sửa được, bạn cần tạo đơn mới với link đúng. Đơn sai sẽ được huỷ và hoàn tiền nếu có.",
  },
  {
    title: "Muốn thay đổi số lượng sau khi tạo đơn",
    category: "Sai thông tin",
    content:
      "Nếu đơn chưa được mua (trạng thái Chờ mua), bạn liên hệ nhân viên để điều chỉnh. Nếu đã mua rồi thì không thay đổi được. Bạn có thể tạo thêm đơn mới nếu muốn mua thêm.",
  },

  // ─── 13. Hàng dễ vỡ ───
  {
    title: "Gửi hàng dễ vỡ có đóng gói cẩn thận không",
    category: "Hàng dễ vỡ",
    content:
      "Có bạn. Kho bên mình sẽ đóng gói thêm xốp, bọt khí cho hàng dễ vỡ. Khi tạo đơn, bạn ghi chú 'Hàng dễ vỡ - đóng gói cẩn thận' để kho ưu tiên xử lý nhé.",
  },
  {
    title: "Hàng dễ vỡ bị vỡ trong vận chuyển",
    category: "Hàng dễ vỡ",
    content:
      "Nếu nhận hàng bị vỡ, bạn chụp ảnh kiện hàng và sản phẩm hư hỏng, gửi cho nhân viên qua Zalo. Bên mình sẽ kiểm tra và xử lý bồi thường theo chính sách.",
  },

  // ─── 14. Hàng cấm / hạn chế ───
  {
    title: "Những mặt hàng nào không ship được",
    category: "Hàng cấm & hạn chế",
    content:
      "Không nhận ship:\n- Vũ khí, chất nổ, pháo\n- Ma tuý, chất cấm\n- Tiền giả, tài liệu phản động\n- Động vật sống\n- Hàng giả thương hiệu lớn\nCác mặt hàng hạn chế cần kiểm tra trước với nhân viên.",
  },
  {
    title: "Hàng nhập khẩu bị hạn chế",
    category: "Hàng cấm & hạn chế",
    content:
      "Một số hàng bị hạn chế nhập khẩu: thuốc lá, rượu (số lượng lớn), thực phẩm chức năng, thiết bị y tế. Bạn hỏi nhân viên trước khi đặt để tránh bị giữ hải quan nhé.",
  },
  {
    title: "Gửi dao kéo / dụng cụ nhà bếp được không",
    category: "Hàng cấm & hạn chế",
    content:
      "Dao kéo nhà bếp thông thường gửi được, nhưng phải khai báo rõ ràng. Dao găm, kiếm, dao bấm thuộc hàng cấm. Khi đặt dao kéo nhà bếp, ghi chú rõ để kho đóng gói an toàn.",
  },

  // ─── 15. Điện tử ───
  {
    title: "Gửi điện thoại hoặc laptop được không",
    category: "Hàng điện tử",
    content:
      "Được, nhưng hàng điện tử có pin lithium thuộc hàng hạn chế. Bên mình ship được với số lượng nhỏ (1-2 cái). Số lượng lớn cần hỏi trước nhân viên. Phí có thể cao hơn hàng thường.",
  },
  {
    title: "Đồ điện tử có bị đánh thuế không",
    category: "Hàng điện tử",
    content:
      "Hàng điện tử giá trị cao (trên 1 triệu VNĐ) có thể bị hải quan kiểm tra và yêu cầu đóng thuế nhập khẩu. Bên mình sẽ thông báo nếu phát sinh thuế. Hàng giá trị thấp thường không bị.",
  },

  // ─── 16. Mỹ phẩm ───
  {
    title: "Gửi mỹ phẩm từ Trung Quốc được không",
    category: "Mỹ phẩm",
    content:
      "Được bạn, mỹ phẩm gửi được bình thường. Tuy nhiên số lượng lớn (trên 10 món cùng loại) có thể bị hải quan kiểm tra. Mỹ phẩm dạng lỏng hoặc xịt cần đóng gói kỹ để tránh rò rỉ.",
  },
  {
    title: "Mỹ phẩm có bị giữ hải quan không",
    category: "Mỹ phẩm",
    content:
      "Mua số lượng nhỏ (dùng cá nhân) thường không bị. Nếu mua số lượng lớn giống buôn bán thì có thể bị kiểm tra. Bạn chia nhỏ đơn hoặc hỏi nhân viên trước khi đặt số lượng lớn.",
  },

  // ─── 17. Pin / nam châm ───
  {
    title: "Gửi pin lithium được không",
    category: "Pin & nam châm",
    content:
      "Pin lithium rời (không gắn trong thiết bị) thuộc hàng nguy hiểm, rất khó ship. Pin gắn sẵn trong điện thoại, laptop, tai nghe thì ship được với số lượng nhỏ. Liên hệ nhân viên để xác nhận trước.",
  },
  {
    title: "Sản phẩm có nam châm gửi được không",
    category: "Pin & nam châm",
    content:
      "Nam châm nhỏ (nam châm trang trí, nam châm tủ lạnh) gửi được. Nam châm công nghiệp lực hút mạnh có thể bị hạn chế vì ảnh hưởng vận chuyển hàng không. Hỏi nhân viên trước nhé.",
  },

  // ─── 18. Chất lỏng ───
  {
    title: "Gửi chất lỏng từ TQ về VN được không",
    category: "Chất lỏng",
    content:
      "Chất lỏng gửi được nhưng cần đóng gói kỹ (bọc kín, chống rò rỉ). Phí có thể cao hơn vì cân nặng lớn. Hoá chất nguy hiểm, chất dễ cháy thì không nhận ship.",
  },
  {
    title: "Gửi nước hoa từ TQ được không",
    category: "Chất lỏng",
    content:
      "Nước hoa gửi được với số lượng nhỏ (dưới 5 chai). Kho sẽ đóng gói chống rò rỉ. Số lượng lớn cần hỏi trước nhân viên vì nước hoa chứa cồn, thuộc hàng hạn chế.",
  },

  // ─── 19. Khiếu nại ───
  {
    title: "Cách khiếu nại đơn hàng",
    category: "Khiếu nại",
    content:
      "Gửi mã đơn hàng + mô tả vấn đề + ảnh chụp (nếu có) cho nhân viên qua Zalo hoặc gọi hotline 0901 234 567. Bên mình sẽ xác minh và phản hồi trong 24 giờ làm việc.",
  },
  {
    title: "Hàng nhận được không đúng mô tả",
    category: "Khiếu nại",
    content:
      "Bạn chụp ảnh hàng nhận được và gửi kèm mã đơn cho nhân viên. Bên mình sẽ kiểm tra với người bán TQ. Nếu lỗi từ người bán, bạn được hỗ trợ đổi/trả hoặc bồi thường theo chính sách.",
  },
  {
    title: "Thời gian xử lý khiếu nại",
    category: "Khiếu nại",
    content:
      "Khiếu nại thường được xử lý trong 1-3 ngày làm việc. Trường hợp cần xác minh với kho TQ hoặc người bán có thể mất 5-7 ngày. Nhân viên sẽ cập nhật tiến độ cho bạn.",
  },

  // ─── 20. Liên hệ hỗ trợ ───
  {
    title: "Cách liên hệ nhân viên hỗ trợ",
    category: "Liên hệ & hỗ trợ",
    content:
      "Liên hệ bên mình qua:\n- Zalo OA: Bắc Trung Hải Logistics\n- Telegram: @bactrunghai_bot\n- Hotline: 0901 234 567\n- Email: support@bactrunghai.vn\nHỗ trợ trong giờ làm việc (T2-T7, 8:00-17:30).",
  },
  {
    title: "Khi nào liên hệ được phản hồi nhanh nhất",
    category: "Liên hệ & hỗ trợ",
    content:
      "Phản hồi nhanh nhất qua Zalo hoặc hotline trong giờ làm việc (T2-T7, 8:00-17:30). Buổi sáng 8:00-11:00 thường ít khách nên được hỗ trợ nhanh hơn. Ngoài giờ, chatbot vẫn tra cứu đơn cho bạn.",
  },

  // ─── 21. Giờ làm việc ───
  {
    title: "Giờ làm việc của công ty",
    category: "Giờ làm việc",
    content:
      "Thứ 2 → Thứ 7: 8:00 - 17:30\nChủ nhật và ngày lễ: Nghỉ\nNgoài giờ, bạn vẫn tra cứu đơn qua chatbot Zalo/Telegram. Nhân viên phản hồi tin nhắn vào ngày làm việc tiếp theo.",
  },
  {
    title: "Ngoài giờ làm việc có hỗ trợ không",
    category: "Giờ làm việc",
    content:
      "Ngoài giờ, chatbot tự động vẫn hoạt động — bạn gửi mã đơn qua Zalo/Telegram để tra cứu. Các yêu cầu cần nhân viên xử lý sẽ được phản hồi vào sáng ngày làm việc tiếp theo.",
  },

  // ─── 22. Ngày lễ / tắc biên ───
  {
    title: "Ngày lễ có ship hàng không",
    category: "Ngày lễ & tắc biên",
    content:
      "Ngày lễ Việt Nam: kho VN nghỉ, hàng tạm dừng giao.\nNgày lễ Trung Quốc: kho TQ nghỉ, hàng tạm dừng nhận.\nHàng đang trên đường vẫn di chuyển bình thường. Bên mình sẽ thông báo lịch nghỉ trước.",
  },
  {
    title: "Tắc biên là gì",
    category: "Ngày lễ & tắc biên",
    content:
      "Tắc biên là khi cửa khẩu biên giới Việt - Trung tạm dừng hoặc chậm thông quan do quá tải, kiểm tra an ninh hoặc chính sách. Khi tắc biên, hàng sẽ chậm hơn bình thường 2-5 ngày.",
  },
  {
    title: "Tết Nguyên đán ship hàng như thế nào",
    category: "Ngày lễ & tắc biên",
    content:
      "Trước Tết ~10 ngày: kho TQ bắt đầu nghỉ, nên đặt hàng sớm.\nTrong Tết: cả 2 kho nghỉ, không xử lý đơn mới.\nSau Tết: kho hoạt động lại từ mùng 6-8, hàng tồn sẽ được xử lý.\nBên mình thông báo lịch cụ thể trước Tết.",
  },

  // ─── 23. Quy trình kho ───
  {
    title: "Quy trình xử lý hàng tại kho",
    category: "Quy trình kho",
    content:
      "Kho nhận hàng → kiểm đếm → cân nặng → chụp ảnh → nhập hệ thống → gom đơn → đóng kiện → xuất kho. Mỗi bước đều được ghi nhận trên hệ thống để bạn theo dõi.",
  },
  {
    title: "Hàng ở kho có bị mở ra kiểm tra không",
    category: "Quy trình kho",
    content:
      "Kho chỉ kiểm tra bên ngoài và cân nặng. Không mở hàng trừ khi nghi ngờ hàng cấm hoặc hư hỏng. Nếu bạn yêu cầu kiểm tra chi tiết (đếm số lượng, kiểm tra màu sắc), ghi chú khi tạo đơn.",
  },
  {
    title: "Kho có đóng gói lại không",
    category: "Quy trình kho",
    content:
      "Có. Kho sẽ đóng gói lại nếu bao bì gốc bị rách hoặc không đủ chắc. Hàng dễ vỡ được bọc thêm xốp. Nếu bạn muốn đóng gói đặc biệt, ghi chú khi tạo đơn nhé.",
  },

  // ─── 24. Giải thích scan barcode ───
  {
    title: "Barcode trên kiện hàng là gì",
    category: "Barcode & mã kiện",
    content:
      "Barcode là mã vạch được dán trên mỗi kiện hàng để nhân viên kho quét và cập nhật trạng thái. Nhờ barcode mà hệ thống biết hàng của bạn đang ở đâu và cập nhật tự động.",
  },
  {
    title: "Scan barcode để làm gì",
    category: "Barcode & mã kiện",
    content:
      "Nhân viên kho scan barcode mỗi khi kiện hàng thay đổi trạng thái: nhận hàng, đóng kiện, xuất kho, nhập kho VN, giao hàng. Mỗi lần scan, trạng thái đơn của bạn được cập nhật tự động.",
  },

  // ─── 25. Giải thích mã kiện / mã đơn ───
  {
    title: "Mã đơn hàng và mã kiện khác nhau thế nào",
    category: "Barcode & mã kiện",
    content:
      "Mã đơn hàng (VD: ORD-20260501-A1B2): dùng để tra cứu từng đơn hàng.\nMã kiện (VD: PKG-20260503-X1Y2): dùng cho kiện hàng vật lý, một kiện có thể chứa nhiều đơn gom chung.",
  },
  {
    title: "Mã đơn hàng xem ở đâu",
    category: "Barcode & mã kiện",
    content:
      "Đăng nhập hệ thống → Đơn hàng của tôi → mã đơn hiển thị ngay đầu mỗi đơn. Hoặc bạn gửi bất kỳ thông tin nào (tên sản phẩm, ngày đặt) cho nhân viên, bên mình tra giúp.",
  },
  {
    title: "Một kiện hàng có nhiều đơn không",
    category: "Barcode & mã kiện",
    content:
      "Có. Để tiết kiệm phí ship, kho thường gom nhiều đơn nhỏ của cùng khách vào chung một kiện. Phí vận chuyển tính theo tổng cân nặng kiện, thường rẻ hơn ship từng đơn riêng.",
  },

  // ─── 26. Ý nghĩa từng trạng thái ───
  {
    title: "Trạng thái Chờ mua nghĩa là gì",
    category: "Ý nghĩa trạng thái",
    content:
      "Nghĩa là đơn hàng đã được tạo và đang chờ nhân viên đặt mua với người bán Trung Quốc. Thường trong 1-2 giờ làm việc sẽ chuyển sang 'Đã mua'.",
  },
  {
    title: "Trạng thái Đã mua nghĩa là gì",
    category: "Ý nghĩa trạng thái",
    content:
      "Nghĩa là nhân viên đã đặt hàng với người bán TQ thành công. Hàng đang chờ người bán đóng gói và gửi đến kho TQ. Thời gian chờ tuỳ người bán, thường 1-3 ngày.",
  },
  {
    title: "Trạng thái Đang giao hàng nghĩa là gì",
    category: "Ý nghĩa trạng thái",
    content:
      "Nghĩa là hàng đã được xuất kho VN và đang trên đường giao đến địa chỉ của bạn. Shipper sẽ gọi cho bạn trước khi giao. Thường giao trong ngày hoặc hôm sau.",
  },
  {
    title: "Trạng thái Hoàn thành nghĩa là gì",
    category: "Ý nghĩa trạng thái",
    content:
      "Nghĩa là đơn hàng đã giao thành công và tiền đã được trừ từ ví. Nếu bạn chưa nhận hàng mà thấy trạng thái này, liên hệ nhân viên ngay để kiểm tra.",
  },
  {
    title: "Trạng thái Người bán đã gửi nghĩa là gì",
    category: "Ý nghĩa trạng thái",
    content:
      "Nghĩa là người bán TQ đã gửi hàng và hàng đang trên đường đến kho Trung Quốc của bên mình. Thường mất 1-3 ngày để hàng đến kho, tuỳ khoảng cách từ shop bán.",
  },

  // ─── 27. Ship nhanh và ship thường ───
  {
    title: "Có dịch vụ ship nhanh không",
    category: "Dịch vụ vận chuyển",
    content:
      "Hiện tại bên mình chủ yếu ship đường bộ (ship thường). Thời gian 3-7 ngày từ kho TQ về kho VN. Nếu bạn cần gấp, liên hệ nhân viên để hỏi về tuyến nhanh (nếu có).",
  },
  {
    title: "Ship nhanh và ship thường khác nhau gì",
    category: "Dịch vụ vận chuyển",
    content:
      "Ship thường: đường bộ, 3-7 ngày, phí thấp hơn.\nShip nhanh: đường bay hoặc tuyến ưu tiên, 1-3 ngày, phí cao hơn.\nPhần lớn đơn hàng đi ship thường. Hỏi nhân viên nếu cần ship nhanh.",
  },

  // ─── 28. Mất hàng / thất lạc ───
  {
    title: "Hàng bị mất thì được bồi thường không",
    category: "Mất hàng & thất lạc",
    content:
      "Nếu hàng bị mất trong quá trình vận chuyển do lỗi của bên mình, bạn sẽ được bồi thường theo giá trị khai báo. Gửi mã đơn và thông tin cho nhân viên để mở hồ sơ xử lý.",
  },
  {
    title: "Kiện hàng bị thất lạc phải làm sao",
    category: "Mất hàng & thất lạc",
    content:
      "Bạn gửi mã đơn/mã kiện cho nhân viên qua Zalo. Bên mình sẽ tra soát toàn bộ hệ thống kho TQ và kho VN. Nếu xác nhận mất, sẽ bồi thường theo chính sách. Thời gian tra soát 3-5 ngày.",
  },

  // ─── 29. Hoàn tiền ───
  {
    title: "Khi nào được hoàn tiền",
    category: "Hoàn tiền",
    content:
      "Bạn được hoàn tiền khi:\n- Đơn bị huỷ trước khi mua hàng\n- Hàng bị mất do lỗi vận chuyển\n- Người bán không gửi hàng\nTiền hoàn vào ví trong hệ thống.",
  },
  {
    title: "Hoàn tiền bao lâu",
    category: "Hoàn tiền",
    content:
      "Đơn huỷ: hoàn ngay trong ngày.\nHàng mất/lỗi: hoàn sau khi xác minh xong, thường 3-7 ngày.\nTiền được hoàn vào ví hệ thống, bạn dùng cho đơn hàng tiếp theo hoặc yêu cầu rút.",
  },
  {
    title: "Huỷ đơn có được hoàn tiền không",
    category: "Hoàn tiền",
    content:
      "Nếu đơn chưa mua (trạng thái Chờ mua): huỷ được, hoàn 100%.\nĐã mua nhưng chưa ship: tuỳ người bán có đồng ý huỷ không.\nĐã ship: không huỷ được, hàng sẽ tiếp tục gửi về.",
  },

  // ─── 30. Người bán TQ chậm gửi ───
  {
    title: "Người bán chậm gửi hàng phải làm sao",
    category: "Người bán TQ",
    content:
      "Nếu đơn ở trạng thái 'Đã mua' quá 5 ngày, bạn liên hệ nhân viên. Bên mình sẽ nhắn người bán hoặc huỷ đơn và tìm shop khác cho bạn. Thường người bán gửi trong 1-3 ngày.",
  },
  {
    title: "Người bán hết hàng thì sao",
    category: "Người bán TQ",
    content:
      "Nếu người bán thông báo hết hàng, nhân viên sẽ liên hệ bạn để:\n- Tìm shop khác cùng sản phẩm\n- Hoặc huỷ đơn và hoàn tiền\nBạn không bị mất tiền trong trường hợp này.",
  },

  // ─── 31. Hàng hoàn ───
  {
    title: "Hàng bị trả về người bán là sao",
    category: "Hàng hoàn",
    content:
      "Hàng hoàn nghĩa là hàng bị gửi ngược về người bán TQ. Nguyên nhân thường do: hàng cấm, khai báo sai, người bán gửi nhầm. Nhân viên sẽ thông báo và xử lý hoàn tiền nếu cần.",
  },
  {
    title: "Phí hoàn hàng ai chịu",
    category: "Hàng hoàn",
    content:
      "Nếu hoàn do lỗi người bán: bên bán chịu phí.\nNếu hoàn do hàng cấm mà khách đặt: khách chịu phí ship nội địa TQ.\nNhân viên sẽ thông báo rõ trước khi xử lý.",
  },

  // ─── 32. Đơn số lượng lớn ───
  {
    title: "Đặt hàng số lượng lớn có giảm giá không",
    category: "Đơn số lượng lớn",
    content:
      "Đơn số lượng lớn (trên 50kg hoặc trên 10 triệu VNĐ) có thể được giảm phí vận chuyển. Liên hệ nhân viên để nhận báo giá riêng. Hàng sỉ từ 1688 thường có giá gốc rẻ hơn.",
  },
  {
    title: "Muốn nhập hàng sỉ từ TQ",
    category: "Đơn số lượng lớn",
    content:
      "Bạn gửi link sản phẩm + số lượng muốn mua cho nhân viên qua Zalo. Bên mình sẽ báo giá tổng (giá hàng + ship + phí dịch vụ) và tư vấn tuyến ship phù hợp cho lô hàng lớn.",
  },

  // ─── 33. Khách doanh nghiệp ───
  {
    title: "Doanh nghiệp có chính sách riêng không",
    category: "Khách doanh nghiệp",
    content:
      "Có. Khách doanh nghiệp đặt thường xuyên sẽ có:\n- Đơn giá vận chuyển ưu đãi\n- Nhân viên phụ trách riêng\n- Hỗ trợ khai báo hải quan\nLiên hệ hotline 0901 234 567 để trao đổi.",
  },
  {
    title: "Xuất hoá đơn VAT được không",
    category: "Khách doanh nghiệp",
    content:
      "Được bạn. Bên mình xuất hoá đơn VAT cho khách doanh nghiệp. Gửi thông tin công ty (tên, MST, địa chỉ) cho nhân viên để lên hoá đơn. Hoá đơn xuất trong vòng 3 ngày làm việc.",
  },

  // ─── 34. Xác nhận địa chỉ ───
  {
    title: "Thay đổi địa chỉ giao hàng",
    category: "Địa chỉ giao hàng",
    content:
      "Nếu hàng chưa xuất kho VN, bạn liên hệ nhân viên để cập nhật địa chỉ mới. Nếu hàng đã giao cho shipper, không đổi được. Cập nhật địa chỉ mặc định trong phần Hồ sơ trên hệ thống.",
  },
  {
    title: "Giao hàng tỉnh khác Lạng Sơn được không",
    category: "Địa chỉ giao hàng",
    content:
      "Được bạn. Bên mình giao toàn quốc qua đối tác vận chuyển (Viettel Post, GHTK). Phí giao hàng tỉnh khác sẽ được tính thêm vào đơn, thường 20.000-40.000đ tuỳ khu vực.",
  },

  // ─── 35. Giao hàng thất bại ───
  {
    title: "Giao hàng không có người nhận",
    category: "Giao hàng thất bại",
    content:
      "Shipper sẽ gọi trước khi giao. Nếu không liên lạc được, hàng sẽ được giữ lại và giao lại lần sau. Sau 3 lần giao thất bại, hàng chuyển về kho. Bạn liên hệ nhân viên để sắp xếp giao lại.",
  },
  {
    title: "Giao hàng sai địa chỉ",
    category: "Giao hàng thất bại",
    content:
      "Nếu shipper giao sai địa chỉ, bạn liên hệ nhân viên ngay kèm mã đơn. Bên mình sẽ xác minh với đối tác vận chuyển và sắp xếp giao lại đúng địa chỉ. Không phát sinh thêm phí.",
  },

  // ─── 36. Xác nhận thanh toán ───
  {
    title: "Đã chuyển khoản nhưng chưa thấy cập nhật số dư",
    category: "Xác nhận thanh toán",
    content:
      "Trong giờ làm việc, số dư cập nhật trong 15-30 phút. Nếu quá lâu, bạn chụp ảnh biên lai chuyển khoản gửi qua Zalo cho nhân viên. Nhớ ghi đúng nội dung chuyển khoản nhé.",
  },
  {
    title: "Chuyển khoản sai nội dung thì sao",
    category: "Xác nhận thanh toán",
    content:
      "Không sao, nhân viên vẫn đối chiếu được qua số tiền và thời gian. Nhưng để nhanh hơn, bạn gửi ảnh biên lai cho nhân viên qua Zalo kèm mã khách hàng. Lần sau ghi đúng nội dung nhé.",
  },

  // ─── 37. Thông báo Zalo ───
  {
    title: "Cách nhận thông báo đơn hàng qua Zalo",
    category: "Thông báo Zalo",
    content:
      "Bạn nhắn tin cho Zalo OA 'Bắc Trung Hải Logistics' và gửi mã đơn hàng. Hệ thống sẽ tự động liên kết tài khoản Zalo của bạn. Sau đó, mỗi khi đơn thay đổi trạng thái, bạn sẽ nhận thông báo qua Zalo.",
  },
  {
    title: "Không nhận được thông báo Zalo",
    category: "Thông báo Zalo",
    content:
      "Kiểm tra:\n- Đã nhắn tin cho Zalo OA chưa (cần nhắn ít nhất 1 lần)\n- Gửi đúng mã đơn để hệ thống liên kết tài khoản\n- Không chặn Zalo OA\nNếu vẫn không nhận được, liên hệ nhân viên nhé.",
  },
  {
    title: "Tra cứu đơn qua Zalo OA",
    category: "Thông báo Zalo",
    content:
      "Mở Zalo → tìm OA 'Bắc Trung Hải Logistics' → gửi mã đơn hàng (VD: ORD-20260501-A1B2). Hệ thống trả lời tự động trạng thái, cân nặng, chi phí. Nhanh và tiện, không cần đăng nhập!",
  },

  // ─── 38. Hướng dẫn Telegram ───
  {
    title: "Cách dùng Telegram bot tra cứu đơn",
    category: "Hướng dẫn Telegram",
    content:
      "Mở Telegram → tìm @bactrunghai_bot → bấm Start → gửi mã đơn hàng. Bot sẽ trả lời trạng thái đơn tự động. Gõ /help để xem hướng dẫn chi tiết.",
  },
  {
    title: "Bot Telegram không trả lời",
    category: "Hướng dẫn Telegram",
    content:
      "Kiểm tra:\n- Gõ đúng mã đơn hàng (VD: ORD-20260501-A1B2)\n- Bấm /start nếu chưa bắt đầu\n- Thử gõ /help\nNếu bot vẫn không phản hồi, có thể đang bảo trì. Dùng Zalo OA để tra cứu thay thế.",
  },
  {
    title: "Telegram bot có những lệnh gì",
    category: "Hướng dẫn Telegram",
    content:
      "/start - Bắt đầu sử dụng bot\n/help - Xem hướng dẫn\n/status - Cách kiểm tra trạng thái\nHoặc gửi trực tiếp mã đơn hàng để tra cứu nhanh. Bot hoạt động 24/7.",
  },

  // ─── 39. Khách mới bắt đầu sử dụng ───
  {
    title: "Bắt đầu sử dụng dịch vụ như thế nào",
    category: "Khách mới",
    content:
      "Bước 1: Đăng ký tài khoản trên hệ thống\nBước 2: Nạp tiền vào ví\nBước 3: Tạo đơn hàng (dán link sản phẩm)\nBước 4: Nhân viên mua hàng và ship về cho bạn\nRất đơn giản, có gì không rõ cứ hỏi nhân viên!",
  },
  {
    title: "Đăng ký tài khoản như thế nào",
    category: "Khách mới",
    content:
      "Truy cập hệ thống → bấm Đăng ký → nhập email, mật khẩu, họ tên, số điện thoại, địa chỉ → bấm Tạo tài khoản. Sau đó đăng nhập và bắt đầu tạo đơn hàng.",
  },
  {
    title: "Lần đầu đặt hàng cần chuẩn bị gì",
    category: "Khách mới",
    content:
      "Bạn cần:\n- Tài khoản trên hệ thống (đăng ký miễn phí)\n- Nạp tiền vào ví (chuyển khoản Vietinbank)\n- Link sản phẩm từ Taobao/1688/Tmall\n- Địa chỉ nhận hàng chính xác\nCó gì thắc mắc cứ nhắn nhân viên nhé!",
  },

  // ─── 40. Câu hỏi phổ biến hàng ngày ───
  {
    title: "Có đảm bảo hàng chính hãng không",
    category: "Câu hỏi thường gặp",
    content:
      "Bên mình là đơn vị vận chuyển, không phải người bán. Hàng chính hãng hay không phụ thuộc shop bạn chọn mua. Mua trên Tmall thường là hàng chính hãng. Taobao/1688 cần xem đánh giá shop.",
  },
  {
    title: "Mua hàng trên Taobao có an toàn không",
    category: "Câu hỏi thường gặp",
    content:
      "Taobao là sàn lớn, phần lớn shop uy tín. Mẹo chọn shop tốt:\n- Xem số lượng đã bán\n- Đọc đánh giá có ảnh\n- Chọn shop có huy hiệu vàng\nBên mình hỗ trợ kiểm tra hàng tại kho TQ trước khi ship.",
  },
  {
    title: "Có kiểm tra hàng trước khi ship về VN không",
    category: "Câu hỏi thường gặp",
    content:
      "Có. Kho TQ sẽ kiểm tra bên ngoài, cân nặng và chụp ảnh. Nếu bạn muốn kiểm tra chi tiết (mở hộp, đếm số lượng, kiểm tra màu), ghi chú khi tạo đơn. Nhân viên sẽ gửi ảnh cho bạn xác nhận.",
  },
  {
    title: "Gửi mã đơn để tra cứu nhanh",
    category: "Câu hỏi thường gặp",
    content:
      "Gửi mã đơn hàng (VD: BTH123456 hoặc ORD-20260501-A1B2) qua Zalo, Telegram hoặc Messenger — hệ thống trả lời trạng thái tự động, không cần đăng nhập. Nhanh nhất là qua Zalo OA!",
  },
  {
    title: "Tra cứu đơn qua Messenger",
    category: "Câu hỏi thường gặp",
    content:
      "Mở Messenger → tìm trang Bắc Trung Hải Logistics → gửi mã đơn hàng. Bot sẽ trả lời trạng thái đơn tự động. Hoạt động 24/7, tiện lợi cho ai dùng Facebook thường xuyên.",
  },

  // ─── Bổ sung: Các tình huống thực tế thường gặp ───
  {
    title: "Đơn bị huỷ là sao",
    category: "Ý nghĩa trạng thái",
    content:
      "Đơn bị huỷ có thể do:\n- Bạn yêu cầu huỷ\n- Người bán hết hàng\n- Hàng thuộc loại cấm ship\nTiền sẽ được hoàn vào ví nếu đã thanh toán. Bạn xem chi tiết trong lịch sử đơn hàng.",
  },
  {
    title: "Trạng thái Đang đóng gói nghĩa là gì",
    category: "Ý nghĩa trạng thái",
    content:
      "Nghĩa là kho TQ đang gom các đơn của bạn vào chung kiện hàng, cân nặng và đóng gói cẩn thận. Sau khi đóng xong, kiện sẽ được xuất kho và chuyển về Việt Nam.",
  },
  {
    title: "Hàng đang vận chuyển về VN nghĩa là gì",
    category: "Ý nghĩa trạng thái",
    content:
      "Kiện hàng đã rời kho TQ và đang trên đường về kho Việt Nam. Thường mất 3-7 ngày. Bạn sẽ nhận thông báo khi hàng tới kho VN.",
  },
  {
    title: "Tôi muốn huỷ đơn hàng",
    category: "Tạo đơn hàng",
    content:
      "Nếu đơn đang ở trạng thái 'Chờ mua': liên hệ nhân viên để huỷ, hoàn tiền 100%.\nĐã mua: cần xác nhận với người bán, có thể mất phí.\nĐã ship: không huỷ được, hàng tiếp tục gửi về.",
  },
  {
    title: "Sao tôi không tạo được đơn hàng",
    category: "Tạo đơn hàng",
    content:
      "Kiểm tra:\n- Đã đăng nhập chưa\n- Link sản phẩm có đúng không (phải từ Taobao/1688/Tmall)\n- Số lượng phải lớn hơn 0\nNếu vẫn không được, chụp màn hình lỗi gửi nhân viên qua Zalo nhé.",
  },
  {
    title: "Đơn hàng có bảo hiểm không",
    category: "Câu hỏi thường gặp",
    content:
      "Hàng thường không có bảo hiểm riêng. Nếu hàng giá trị cao (trên 5 triệu VNĐ), bạn yêu cầu nhân viên tư vấn thêm về bảo hiểm hàng hoá. Bên mình vẫn bồi thường nếu mất hàng do lỗi vận chuyển.",
  },
  {
    title: "Phí ship nội địa Trung Quốc là gì",
    category: "Cân nặng & phí",
    content:
      "Là phí vận chuyển từ kho người bán đến kho của bên mình ở Trung Quốc. Phí này do người bán thu hoặc miễn phí tuỳ shop. Hệ thống sẽ hiển thị phí này khi bạn tạo đơn.",
  },
  {
    title: "Phí giao hàng nội địa VN là bao nhiêu",
    category: "Cân nặng & phí",
    content:
      "Nội thành Lạng Sơn: 20.000-30.000đ.\nTỉnh thành khác: 25.000-50.000đ tuỳ khu vực và cân nặng.\nPhí được tính sẵn trong tổng chi phí đơn hàng khi bạn tạo đơn.",
  },
  {
    title: "Có nhận order hộ hàng không có link không",
    category: "Tạo đơn hàng",
    content:
      "Được bạn. Gửi ảnh sản phẩm, mô tả chi tiết (tên, màu, size, số lượng) cho nhân viên qua Zalo. Bên mình sẽ tìm sản phẩm trên Taobao/1688 và gửi link để bạn xác nhận trước khi đặt.",
  },
  {
    title: "Hàng nặng trên 50kg ship được không",
    category: "Dịch vụ vận chuyển",
    content:
      "Ship được bạn. Hàng nặng trên 50kg bên mình vẫn nhận, phí vận chuyển theo kg. Đơn lớn có thể được giảm giá. Liên hệ nhân viên để nhận báo giá riêng cho lô hàng nặng.",
  },
  {
    title: "Hàng cồng kềnh tính phí thế nào",
    category: "Cân nặng & phí",
    content:
      "Hàng cồng kềnh (nhẹ nhưng to) có thể tính theo cân nặng thể tích:\nDài × Rộng × Cao (cm) ÷ 6000 = cân quy đổi (kg).\nHệ thống lấy số lớn hơn giữa cân thực và cân quy đổi để tính phí.",
  },
  {
    title: "Thời gian vận chuyển mùa sale 11/11, 12/12",
    category: "Thời gian vận chuyển",
    content:
      "Mùa sale lớn (11/11, 12/12, 618) hàng thường chậm hơn bình thường 3-5 ngày do lượng hàng tăng đột biến. Nên đặt hàng trước và kiên nhẫn chờ. Bên mình ưu tiên xử lý nhanh nhất có thể.",
  },
  {
    title: "Sao đơn tôi chưa được mua",
    category: "Đơn chậm cập nhật",
    content:
      "Nếu đơn vẫn ở trạng thái 'Chờ mua' quá 2 giờ (trong giờ làm việc), có thể do:\n- Nhân viên đang xử lý đơn trước\n- Link sản phẩm có vấn đề\nLiên hệ nhân viên để kiểm tra nhé.",
  },
  {
    title: "Tôi muốn mua giúp người khác",
    category: "Câu hỏi thường gặp",
    content:
      "Được bạn. Bạn tạo đơn bình thường, ở phần địa chỉ giao hàng ghi địa chỉ người nhận. Ghi chú thêm số điện thoại người nhận để shipper liên hệ. Tiền trừ từ ví của bạn.",
  },
  {
    title: "Có app di động không",
    category: "Câu hỏi thường gặp",
    content:
      "Hiện tại bên mình chưa có app riêng. Bạn truy cập hệ thống qua trình duyệt trên điện thoại, giao diện đã tối ưu cho mobile. Tra cứu nhanh thì dùng Zalo OA hoặc Telegram bot rất tiện.",
  },
  {
    title: "Quên mật khẩu đăng nhập",
    category: "Khách mới",
    content:
      "Liên hệ nhân viên qua Zalo hoặc hotline 0901 234 567 kèm email đăng ký. Bên mình sẽ hỗ trợ đặt lại mật khẩu cho bạn trong vài phút.",
  },
  {
    title: "Đổi số điện thoại nhận hàng",
    category: "Địa chỉ giao hàng",
    content:
      "Đăng nhập hệ thống → Hồ sơ → cập nhật số điện thoại mới. Hoặc nhắn nhân viên qua Zalo để đổi. Nhớ cập nhật trước khi hàng giao để shipper liên lạc đúng số nhé.",
  },
];
