window.CDR_PRACTICAL_TEMPLATES = [
  {
    id: 'seafood-sales',
    name: 'Dạng 1 · Doanh số bán hải sản',
    shortName: 'Doanh số hải sản',
    icon: '01',
    description: 'Tra cứu mặt hàng, loại hàng, thuế và cước vận chuyển từ mã bán hàng.',
    rubric: [
      { title: 'Nhập dữ liệu và tạo các bảng theo đề', points: 0.5 },
      { title: 'Định dạng Calibri, khung, màu nền và dấu phân cách hàng nghìn', points: 0.5 },
      { title: 'Dùng ký tự đầu của mã để tra cứu tên mặt hàng', points: 0.5 },
      { title: 'Tra đơn giá theo mặt hàng và loại tươi/khô', points: 0.5 },
      { title: 'Tính thuế theo số lượng, đơn giá và thuế suất tra cứu', points: 0.5 },
      { title: 'Tính cước: nội thành bằng 0, ngoại thành tính theo số km × 900', points: 0.5 },
      { title: 'Tính giá bán = số lượng × đơn giá + thuế + cước vận chuyển', points: 0.5 },
      { title: 'Hoàn thành bảng thống kê số đơn và số lượng theo mặt hàng', points: 0.5 }
    ]
  },
  {
    id: 'cinema-tickets',
    name: 'Dạng 2 · Lịch chiếu và doanh thu vé phim',
    shortName: 'Vé xem phim',
    icon: '02',
    description: 'Tách mã vé để tìm phim, giờ chiếu, loại vé và tính ưu đãi voucher.',
    rubric: [
      { title: 'Nhập bảng vé, bảng giá vé và bảng thống kê', points: 0.5 },
      { title: 'Định dạng Calibri, khung, màu nền và dấu phân cách hàng nghìn', points: 0.5 },
      { title: 'Tra tên phim bằng hai ký tự đầu của mã vé', points: 0.5 },
      { title: 'Xác định giờ chiếu: mã kết thúc 1–2 là 14:00, còn lại 20:00', points: 0.5 },
      { title: 'Tra giá vé theo mã phim và ký hiệu vé trẻ em/người lớn', points: 0.5 },
      { title: 'Tính thành tiền và giảm 3% khi mua trên 5 vé', points: 0.5 },
      { title: 'Hoàn thành thống kê số vé và số đơn theo phim', points: 0.5 },
      { title: 'Dùng bộ lọc tìm suất 14:00 có khách được hưởng voucher', points: 0.5 }
    ]
  },
  {
    id: 'quarterly-sales',
    name: 'Dạng 3 · Doanh số bán hàng theo quý',
    shortName: 'Doanh số theo quý',
    icon: '03',
    description: 'Tra cứu tên hàng, quy cách, đơn giá theo tháng và tính giảm giá.',
    rubric: [
      { title: 'Nhập dữ liệu bán hàng, bảng tra và bảng thống kê', points: 0.5 },
      { title: 'Định dạng Calibri, khung, màu nền và dấu phân cách hàng nghìn', points: 0.5 },
      { title: 'Tra tên hàng từ hai ký tự đầu của mã hóa đơn', points: 0.5 },
      { title: 'Xác định quy cách: A/Q là Cái, G/D là Đôi', points: 0.5 },
      { title: 'Tra đơn giá theo mã hàng và tháng bán', points: 0.5 },
      { title: 'Tính thành tiền; giảm 3% cho áo thun có số lượng trên 150', points: 0.5 },
      { title: 'Hoàn thành thống kê thành tiền và số đơn theo mặt hàng', points: 0.5 },
      { title: 'Lọc đơn tháng 1 có số lượng bán từ 200 trở lên', points: 0.5 }
    ]
  },
  {
    id: 'apparel-sales',
    name: 'Dạng 4 · Bảng kê mặt hàng may mặc',
    shortName: 'Hàng may mặc',
    icon: '04',
    description: 'Tra tên hàng, đơn giá theo loại, tính mức giảm giá theo số lượng.',
    rubric: [
      { title: 'Nhập bảng kê, bảng tra và bảng thống kê', points: 0.5 },
      { title: 'Định dạng Calibri, kẻ khung và tô nền theo mẫu', points: 0.5 },
      { title: 'Định dạng dữ liệu số có dấu phân cách hàng nghìn', points: 0.5 },
      { title: 'Tra tên hàng theo hai ký tự đầu của mã hóa đơn', points: 0.5 },
      { title: 'Tra đơn giá theo mã hàng và loại hàng ở ký tự thứ ba', points: 0.5 },
      { title: 'Tính thành tiền = số lượng × đơn giá', points: 0.5 },
      { title: 'Tính giảm giá: từ 150 chiếc giảm 50%, từ 50 chiếc giảm 15%', points: 0.5 },
      { title: 'Tính tổng tiền = thành tiền − giảm giá', points: 0.5 },
      { title: 'Hoàn thành thống kê số đơn và tổng tiền theo mã hàng', points: 0.5 }
    ]
  }
];
