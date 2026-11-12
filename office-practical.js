(() => {
  'use strict';

  const pick = items => items[Math.floor(Math.random() * items.length)];
  const sample = (items, count) => [...items].sort(() => Math.random() - 0.5).slice(0, count);
  const date = () => `ngày ${String(1 + Math.floor(Math.random() * 27)).padStart(2, '0')} tháng ${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')} năm 2026`;

  const word = [
    {
      id: 'thesis-registration',
      name: 'Đơn đăng ký thực hiện luận văn',
      duration: 35,
      description: 'Soạn và trình bày đơn hành chính theo mẫu đăng ký luận văn trong tài liệu ôn thi.',
      rubric: [
        ['Khổ A4, hướng dọc, lề trái 2,5 cm; lề trên, dưới và phải 2 cm', 1],
        ['Toàn văn Times New Roman 13 pt; giãn dòng Multiple 1,3; Before/After 3 pt', 1],
        ['Trình bày phần tên cơ quan và quốc hiệu bằng bảng, căn giữa, kẻ đường phân cách', 1],
        ['Tiêu đề đơn 16 pt, in đậm và căn giữa', 1],
        ['Dòng Kính gửi dùng tab, lùi 1 cm, in nghiêng, đậm và gạch chân', 1],
        ['Dùng tab leader dấu chấm cho các dòng thông tin cần điền', 1],
        ['Đoạn đăng ký và cam đoan in nghiêng, lùi đầu dòng 1 cm', 1],
        ['Trình bày phần xác nhận và ký tên cuối đơn bằng bảng, định dạng theo mẫu', 1]
      ],
      make() {
        const topic = pick(['Ứng dụng công nghệ thông tin trong quản lý đào tạo', 'Chuyển đổi số trong hoạt động thư viện', 'Ứng dụng bảng tính trong quản lý dữ liệu', 'Phân tích dữ liệu phục vụ công tác chuyên môn']);
        const field = pick(['Hệ thống thông tin', 'Công nghệ thông tin', 'Quản lý dữ liệu', 'Tin học ứng dụng']);
        const today = date();
        return {
          title: 'Đơn đăng ký thực hiện luận văn',
          paragraphs: [
            'TRƯỜNG ĐẠI HỌC LÂM NGHIỆP\\nPHÂN HIỆU ĐỒNG NAI',
            'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\\nĐộc lập - Tự do - Hạnh phúc',
            `Phân hiệu Đồng Nai, ${today}`,
            'ĐƠN ĐĂNG KÝ THỰC HIỆN LUẬN VĂN',
            'Kính gửi: Ban Giám hiệu Trường Đại học Lâm nghiệp;\\n                Phòng Đào tạo.',
            'Tên tôi là: ........................................................................     Giới tính: ........................................',
            'Ngày sinh: .................................................................     Nơi sinh: ...........................................',
            'Học viên lớp: ............................................................     Chuyên ngành: ...................................',
            'Điện thoại: .................................................................     Email: ..............................................',
            'Nơi công tác: ........................................................................................................................',
            'Tôi xin đăng ký thực hiện luận văn tốt nghiệp theo kế hoạch của Nhà trường với các nội dung sau:',
            `Định hướng nghiên cứu: ${topic}`,
            'Đề xuất người hướng dẫn: ...........................................................................................................',
            'Tên đề tài dự kiến: ........................................................................................................................',
            'Địa điểm thực hiện: .........................................................................................................................',
            'Lý do lựa chọn hướng nghiên cứu: ................................................................................................',
            'Tôi cam đoan thực hiện luận văn theo đúng kế hoạch và sự phân công của Nhà trường.',
            'XÁC NHẬN CỦA NGƯỜI HƯỚNG DẪN\\n(Ký, ghi rõ họ tên)\\t\\tNGƯỜI LÀM ĐƠN\\n\\t\\t(Ký, ghi rõ họ tên)'
          ],
          facts: [`Ngành học phiên bản này: ${field}.`, 'Có thể thay thông tin chấm bằng thông tin cá nhân của người học.']
        };
      }
    },
    {
      id: 'defer-exam',
      name: 'Đơn xin hoãn thi kết thúc học phần',
      duration: 35,
      description: 'Dàn trang đơn hoãn thi, tab dấu chấm, nhấn mạnh đoạn văn và tạo bảng môn thi.',
      rubric: [
        ['Khổ A4, hướng dọc, lề trái 2,5 cm; lề trên, dưới và phải 2 cm', 1],
        ['Toàn văn Times New Roman 13 pt; giãn dòng Multiple 1,3; Before/After 3 pt', 1],
        ['Trình bày phần tên cơ quan và quốc hiệu bằng bảng, căn giữa, kẻ đường phân cách', 1],
        ['Tiêu đề đơn 16 pt, in đậm và căn giữa; ngắt dòng đúng mẫu', 1],
        ['Dùng tab và dấu chấm dẫn cho thông tin cá nhân và các dòng Kính gửi', 1],
        ['Đoạn đề nghị và cam kết in đậm, nghiêng, lùi đầu dòng 1 cm', 1],
        ['Tạo bảng môn thi có hàng tiêu đề STT, Môn thi, Ca thi, Phòng thi, Ngày thi', 1],
        ['Bố trí ngày tháng và chữ ký cuối đơn bằng bảng, căn chỉnh rõ ràng', 1]
      ],
      make() {
        const course = pick(['Tin học cơ sở', 'Ứng dụng công nghệ thông tin', 'Kỹ năng sử dụng bảng tính', 'Tin học văn phòng']);
        const reason = pick(['trùng lịch công tác đột xuất', 'lý do sức khỏe', 'tham gia hoạt động chuyên môn của đơn vị', 'lý do cá nhân bất khả kháng']);
        const today = date();
        return {
          title: 'Đơn xin hoãn thi kết thúc học phần',
          paragraphs: [
            'TRƯỜNG ĐẠI HỌC LÂM NGHIỆP\\nPHÂN HIỆU ĐỒNG NAI',
            'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\\nĐộc lập - Tự do - Hạnh phúc',
            'ĐƠN XIN\\nHOÃN THI KẾT THÚC HỌC PHẦN',
            'Kính gửi: Ban Giám hiệu Trường Đại học Lâm nghiệp;\\n                Phòng Đào tạo.',
            'Tên tôi là: ........................................................................     Giới tính: ........................................',
            'Mã sinh viên: ...............................................................     Ngày sinh: ...........................................',
            'Lớp: ................................................................................     Chuyên ngành: ...................................',
            'Điện thoại: .................................................................     Email: ..............................................',
            `Lý do: ${reason}.`,
            `Nay tôi làm đơn kính đề nghị Nhà trường xem xét cho tôi hoãn thi học phần ${course} và được tham gia thi vào đợt tiếp theo.`,
            'DANH SÁCH HỌC PHẦN XIN HOÃN THI',
            'STT\\tMôn thi\\tCa thi\\tPhòng thi\\tNgày thi',
            `1\\t${course}\\t........\\t........\\t........`,
            'Tôi xin chấp hành đầy đủ các quy định của Phòng và Nhà trường.',
            `Phân hiệu Đồng Nai, ${today}\\t\\tNGƯỜI LÀM ĐƠN\\n\\t\\t(Ký và ghi rõ họ tên)`
          ],
          facts: [`Học phần trong phiên bản này: ${course}.`, 'Lý do đề nghị hoãn thi đã được thay đổi cho phiên bản này.']
        };
      }
    },
    {
      id: 'english-registration',
      name: 'Phiếu đăng ký dự thi tiếng Anh',
      duration: 35,
      description: 'Tạo phiếu đăng ký có ảnh 3×4, danh sách đánh số, tab chấm và phần cam đoan.',
      rubric: [
        ['Khổ A4, hướng dọc, lề trái 2,5 cm; lề trên, dưới và phải 2 cm', 1],
        ['Toàn văn Times New Roman 13 pt; giãn dòng Multiple 1,3; Before/After 3 pt', 1],
        ['Phần tên cơ quan căn chỉnh bằng tab, giãn dòng đơn và có đường gạch chân', 1],
        ['Tiêu đề PHIẾU ĐĂNG KÝ 16 pt, đậm, căn giữa; tiêu đề phụ đậm, căn giữa', 1],
        ['Tạo hộp văn bản hoặc khung ảnh ghi Ảnh 3x4 ở vị trí phù hợp', 1],
        ['Dùng tab leader dấu chấm cho trường thông tin; trình bày lựa chọn giới tính', 1],
        ['Đánh số các mục thông tin và định dạng đoạn cam đoan đậm, nghiêng, lùi 1 cm', 1],
        ['Căn ngày tháng và phần ký tên cuối phiếu bằng bảng', 1]
      ],
      make() {
        const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
        const examMonth = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
        return {
          title: 'Phiếu đăng ký dự thi tiếng Anh',
          paragraphs: [
            'TRƯỜNG ĐẠI HỌC LÂM NGHIỆP\\tPHÂN HIỆU ĐỒNG NAI',
            'PHÒNG ĐÀO TẠO',
            'ẢNH 3 x 4',
            'PHIẾU ĐĂNG KÝ',
            '(Dự thi tiếng Anh trình độ B1 theo khung tham chiếu Châu Âu)',
            `Kỳ thi tháng ${examMonth} năm 2026`,
            '1. Họ tên thí sinh: ................................................................     Giới tính: Nam □  Nữ □',
            `2. Ngày sinh: ........../${month}/........     Nơi sinh: ......................................................................`,
            '3. Lớp: .................................................................................     Chuyên ngành: ...................................',
            '4. Điện thoại: .................................................................     E-mail: ..............................................',
            '5. Đơn vị công tác: .........................................................................................................................',
            '6. Đăng ký ôn thi:     Có ôn thi □     Không ôn thi □',
            'Tôi cam đoan những thông tin cung cấp trên đây là chính xác và xin chịu trách nhiệm nếu có sai sót.',
            'Ghi chú: Nộp 03 ảnh cỡ 3x4 ghi rõ họ tên, ngày sinh, nơi sinh để làm thẻ dự thi.',
            `Phân hiệu Đồng Nai, ngày ${String(1 + Math.floor(Math.random() * 27)).padStart(2, '0')} tháng ${month} năm 2026\\t\\tNGƯỜI ĐĂNG KÝ DỰ THI\\n\\t\\t(Ký và ghi rõ họ tên)`
          ],
          facts: ['Dự thi tiếng Anh trình độ B1 theo khung tham chiếu Châu Âu.', 'Thông tin ngày thi được thay đổi cho mỗi lần tạo phiếu.']
        };
      }
    }
  ];

  const powerpoint = [
    {
      id: 'office-shortcuts',
      name: 'Dạng 1 · Phím tắt và Change Case',
      duration: 30,
      description: 'Tạo bảng phím tắt và SmartArt minh họa các kiểu chữ bằng Shift + F3.',
      rubric: [
        ['Tạo 2 slide, bố cục Title and Content, font Calibri', 1],
        ['Tiêu đề 40 pt, đậm, căn giữa, màu xanh theo mẫu', 1],
        ['Slide 1 có bảng phím tắt với cỡ chữ 20', 1],
        ['Slide 2 có SmartArt minh họa các kiểu chữ Change Case', 1],
        ['Chọn hiệu ứng chuyển trang Shape, âm thanh Arrow, Duration 1,00 giây', 1],
        ['Áp dụng hiệu ứng Float In, Duration 0,50 giây cho các đối tượng', 1],
        ['Trình chiếu thử, kiểm tra bố cục và lưu bài dạng PPTX', 1]
      ],
      make() {
        const shortcuts = sample([
          ['Ctrl + A', 'Chọn tất cả đối tượng'],
          ['Ctrl + N', 'Tạo mới tài liệu'],
          ['Ctrl + S', 'Lưu tài liệu'],
          ['Ctrl + P', 'In tài liệu'],
          ['Ctrl + C', 'Sao chép'],
          ['Ctrl + V', 'Dán nội dung'],
          ['Ctrl + Z', 'Hoàn tác thao tác']
        ], 4);
        const cases = ['UPPERCASE', 'lowercase', 'Capitalize Each Word', 'Toggle Case'];
        return {
          slides: [
            { title: 'Tổ hợp phím tắt trong Microsoft Office', bullets: ['Tạo bảng gồm hai cột: Phím tắt và Chức năng', ...shortcuts.map(row => `${row[0]} — ${row[1]}`)] },
            { title: 'PHÍM TẮT SHIFT + F3', bullets: ['Tạo SmartArt hoặc sơ đồ minh họa thao tác đổi kiểu chữ', ...cases] }
          ],
          facts: ['Dùng bố cục Title and Content; slide 1 chèn bảng.', 'Dùng SmartArt hoặc sơ đồ phù hợp để trình bày Change Case.']
        };
      }
    },
    {
      id: 'job-comparison',
      name: 'Dạng 2 · So sánh và quy trình tuyển dụng',
      duration: 35,
      description: 'Dùng bố cục Comparison, SmartArt và hiệu ứng để trình bày nội dung tuyển dụng.',
      rubric: [
        ['Slide 1 dùng bố cục Comparison, font Calibri', 1],
        ['Tiêu đề 40 pt, đậm, căn giữa, màu xanh nhạt; nội dung 24 pt', 1],
        ['Trình bày hai cột Nhân viên và Chuyên viên với nội dung so sánh', 1],
        ['Slide 2 dùng Title and Content và SmartArt quy trình tuyển dụng', 1],
        ['Các bước tuyển dụng đầy đủ, theo thứ tự hợp lý', 1],
        ['Chuyển trang Shape, Duration 1,00 giây; hiệu ứng đối tượng Float In 0,50 giây', 1],
        ['Trình chiếu thử, kiểm tra bố cục và lưu bài dạng PPTX', 1]
      ],
      make() {
        const title = pick(['So sánh nhân viên và chuyên viên', 'Vai trò trong nhóm làm việc', 'Phân công công việc trong tổ chức']);
        const stages = sample([
          'Xác định nhu cầu tuyển dụng',
          'Lập kế hoạch tuyển dụng',
          'Phân tích công việc',
          'Tìm kiếm ứng viên',
          'Sàng lọc hồ sơ',
          'Phỏng vấn',
          'Đánh giá ứng viên',
          'Mời nhận việc'
        ], 7);
        return {
          slides: [
            { title, bullets: ['Cột 1 — Nhân viên', 'Nhân sự cấp cơ sở; thực hiện nhiệm vụ được giao; phối hợp với nhóm.', 'Cột 2 — Chuyên viên', 'Đảm nhiệm công việc chuyên môn; tham mưu, định hướng và đề xuất giải pháp.'] },
            { title: 'Quy trình tuyển dụng nhân sự', bullets: stages.map((stage, index) => `${index + 1}. ${stage}`) }
          ],
          facts: ['Slide 1 dùng bố cục Comparison.', 'Slide 2 trình bày quy trình bằng SmartArt.']
        };
      }
    },
    {
      id: 'soft-skills',
      name: 'Dạng 3 · Kỹ năng mềm cho sinh viên',
      duration: 35,
      description: 'Làm slide tiêu đề WordArt và một SmartArt tổng hợp kỹ năng mềm.',
      rubric: [
        ['Slide 1 dùng bố cục Title Slide và font Calibri', 1],
        ['Tiêu đề dùng WordArt, cỡ 45 pt, căn giữa', 1],
        ['Phụ đề dùng tab, cỡ 20 pt và có thông tin người thực hiện', 1],
        ['Slide 2 dùng Title and Content; tiêu đề 40 pt, đậm, màu xanh nhạt', 1],
        ['Chèn SmartArt và trình bày đủ 7 kỹ năng mềm', 2],
        ['Chuyển trang Shape, Duration 1 giây; hiệu ứng Float In 0,50 giây', 1],
        ['Trình chiếu thử, kiểm tra bố cục và lưu bài dạng PPTX', 1]
      ],
      make() {
        const skills = sample([
          'Kỹ năng lắng nghe',
          'Kỹ năng giao tiếp',
          'Quản lý thời gian',
          'Giải quyết vấn đề',
          'Làm việc nhóm',
          'Linh hoạt, thích nghi nhanh',
          'Làm việc dưới áp lực',
          'Tư duy phản biện'
        ], 7);
        const presenter = pick(['Nguyễn Minh Anh', 'Trần Gia Bảo', 'Lê Hoàng Yến', 'Phạm Quốc Huy']);
        return {
          slides: [
            { title: 'Kỹ năng mềm cần thiết cho sinh viên', bullets: [`Giảng viên hướng dẫn:\t................................`, `Sinh viên thực hiện:\t${presenter}`, 'Lớp:\t................................'] },
            { title: 'Bộ kỹ năng mềm', bullets: skills }
          ],
          facts: ['Slide mở đầu dùng WordArt; slide nội dung dùng SmartArt.', `Tên người thực hiện trong phiên bản này: ${presenter}.`]
        };
      }
    },
    {
      id: 'enrollment-report',
      name: 'Dạng 4 · Thống kê tuyển sinh và cơ cấu tổ chức',
      duration: 35,
      description: 'Tạo slide số liệu tuyển sinh và SmartArt thể hiện cây tổ chức.',
      rubric: [
        ['Hai slide dùng bố cục Title and Content và font Arial', 1],
        ['Tiêu đề 40 pt, đậm, căn giữa, màu xanh nhạt', 1],
        ['Slide 1 có nội dung phân cấp bằng Bullets và Numbering; cấp 1 là 24 pt', 1],
        ['Dữ liệu tuyển sinh có hai hệ đào tạo và ba ngành', 1],
        ['Slide 2 dùng SmartArt mô tả cơ cấu tổ chức nhiều cấp', 1],
        ['Chuyển trang Shape, Duration 1 giây; hiệu ứng Float In 0,50 giây', 1],
        ['Trình chiếu thử, kiểm tra bố cục và lưu bài dạng PPTX', 1]
      ],
      make() {
        const base = 35 + Math.floor(Math.random() * 66);
        const faculties = sample(['Khoa Kinh tế', 'Khoa Lâm học', 'Khoa Quản lý tài nguyên rừng'], 3);
        const units = sample(['BM Kế toán', 'BM Quản trị kinh doanh', 'BM Quản lý đất đai', 'BM Lâm sinh', 'BM Khoa học môi trường', 'BM Quản lý tài nguyên rừng'], 6);
        return {
          slides: [
            { title: 'Thống kê sinh viên nhập học năm học 2026–2027', bullets: ['Hệ chính quy', `Ngành Kế toán: ${base + 12} sinh viên`, `Ngành Quản lý đất đai: ${base + 7} sinh viên`, `Ngành Quản lý tài nguyên rừng: ${base + 3} sinh viên`, 'Hệ vừa làm vừa học', `Ngành Kế toán: ${base + 5} sinh viên`, `Ngành Quản lý đất đai: ${base + 9} sinh viên`, `Ngành Quản lý tài nguyên rừng: ${base + 2} sinh viên`] },
            { title: 'Cơ cấu tổ chức đơn vị', bullets: ['Ban giám hiệu', ...faculties, ...units.map(unit => `  ${unit}`)] }
          ],
          facts: ['Slide 1 dùng Bullets/Numbering và phân cấp nội dung.', `Tổng số liệu tuyển sinh của phiên bản này được tạo tự động (mốc ${base}).`, 'Slide 2 dùng SmartArt dạng phân cấp để dựng sơ đồ tổ chức.']
        };
      }
    }
  ];

  window.CDR_OFFICE_PRACTICALS = { word, powerpoint };
})();
