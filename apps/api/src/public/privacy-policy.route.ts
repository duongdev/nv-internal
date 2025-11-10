import { Hono } from 'hono'
import { html } from 'hono/html'

const router = new Hono()

// Privacy Policy route - publicly accessible (no authentication)
router.get('/', (c) => {
  return c.html(html`
    <!DOCTYPE html>
    <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Privacy Policy for Nam Việt Internal mobile application" />
        <title>Privacy Policy - Nam Việt Internal</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
            padding: 0;
            margin: 0;
          }

          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: white;
            min-height: 100vh;
          }

          header {
            text-align: center;
            padding: 30px 0;
            border-bottom: 3px solid #0066cc;
            margin-bottom: 30px;
          }

          h1 {
            font-size: 28px;
            color: #0066cc;
            margin-bottom: 10px;
            font-weight: 600;
          }

          .last-updated {
            color: #666;
            font-size: 14px;
            font-style: italic;
          }

          .language-section {
            margin-bottom: 50px;
            padding: 20px 0;
          }

          .language-section:not(:last-child) {
            border-bottom: 2px solid #e0e0e0;
          }

          h2 {
            font-size: 24px;
            color: #0066cc;
            margin: 30px 0 15px 0;
            font-weight: 600;
          }

          h3 {
            font-size: 20px;
            color: #333;
            margin: 25px 0 15px 0;
            font-weight: 600;
          }

          h4 {
            font-size: 18px;
            color: #444;
            margin: 20px 0 10px 0;
            font-weight: 600;
          }

          p {
            margin-bottom: 15px;
            text-align: justify;
          }

          ul, ol {
            margin: 10px 0 15px 25px;
            padding-left: 20px;
          }

          li {
            margin-bottom: 8px;
          }

          strong {
            font-weight: 600;
            color: #222;
          }

          .contact-info {
            background-color: #f0f7ff;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #0066cc;
          }

          .contact-info p {
            margin-bottom: 8px;
          }

          footer {
            text-align: center;
            padding: 30px 0;
            margin-top: 50px;
            border-top: 2px solid #e0e0e0;
            color: #666;
            font-size: 14px;
          }

          /* Mobile optimization */
          @media (max-width: 768px) {
            .container {
              padding: 15px;
            }

            h1 {
              font-size: 24px;
            }

            h2 {
              font-size: 20px;
            }

            h3 {
              font-size: 18px;
            }

            h4 {
              font-size: 16px;
            }

            header {
              padding: 20px 0;
            }

            .language-section {
              padding: 15px 0;
            }

            .contact-info {
              padding: 15px;
            }
          }

          /* Improve readability on very small screens */
          @media (max-width: 480px) {
            body {
              font-size: 15px;
            }

            .container {
              padding: 10px;
            }

            h1 {
              font-size: 22px;
            }

            ul, ol {
              margin-left: 15px;
              padding-left: 15px;
            }
          }

          /* Accessibility improvements */
          a {
            color: #0066cc;
            text-decoration: none;
            border-bottom: 1px solid transparent;
          }

          a:hover {
            border-bottom-color: #0066cc;
          }

          a:focus {
            outline: 2px solid #0066cc;
            outline-offset: 2px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <h1>Privacy Policy</h1>
            <h2 style="margin-top: 10px; font-size: 22px;">Chính Sách Bảo Mật</h2>
            <p class="last-updated">Last Updated / Cập nhật lần cuối: November 6, 2025</p>
          </header>

          <!-- English Version -->
          <section class="language-section" id="english">
            <h2>English Version</h2>

            <h3>Privacy Policy for Nam Việt Internal</h3>
            <p><strong>Effective Date:</strong> November 6, 2025</p>

            <p>
              CÔNG TY TNHH THƯƠNG MẠI VÀ ĐIỆN LẠNH NAM VIỆT ("Nam Việt", "we", "our", or "us") is committed to protecting the privacy of our employees who use the Nam Việt Internal mobile application ("the App"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our App.
            </p>

            <h4>1. Information We Collect</h4>
            <p>When you use Nam Việt Internal, we collect the following types of information:</p>

            <p><strong>Personal Information:</strong></p>
            <ul>
              <li>Name and employee ID</li>
              <li>Email address</li>
              <li>Phone number (if provided)</li>
              <li>User credentials for authentication</li>
            </ul>

            <p><strong>Location Information:</strong></p>
            <ul>
              <li>Precise GPS location data for check-in/check-out verification</li>
              <li>Location history during work hours</li>
              <li>Work site coordinates</li>
            </ul>

            <p><strong>Media and Files:</strong></p>
            <ul>
              <li>Photos taken through the App for task documentation</li>
              <li>Photos selected from device gallery for work reports</li>
              <li>File attachments related to tasks</li>
            </ul>

            <p><strong>Device Information:</strong></p>
            <ul>
              <li>Device type and model</li>
              <li>Operating system version</li>
              <li>App version</li>
              <li>Unique device identifiers</li>
              <li>Network information</li>
            </ul>

            <p><strong>Usage Data:</strong></p>
            <ul>
              <li>App interaction data</li>
              <li>Feature usage statistics</li>
              <li>Task completion metrics</li>
              <li>Check-in/check-out times</li>
              <li>Error logs and crash reports</li>
            </ul>

            <h4>2. How We Use Your Information</h4>
            <p>We use the collected information for the following purposes:</p>

            <p><strong>Core App Functionality:</strong></p>
            <ul>
              <li>Verify employee location during check-in/check-out</li>
              <li>Document task completion with photos</li>
              <li>Assign and manage work tasks</li>
              <li>Track employee attendance and work hours</li>
              <li>Generate performance reports</li>
            </ul>

            <p><strong>Business Operations:</strong></p>
            <ul>
              <li>Monitor service quality and completion</li>
              <li>Calculate payments and commissions</li>
              <li>Improve task assignment efficiency</li>
              <li>Ensure compliance with company policies</li>
            </ul>

            <p><strong>App Improvement:</strong></p>
            <ul>
              <li>Fix bugs and technical issues</li>
              <li>Analyze app performance</li>
              <li>Develop new features</li>
              <li>Provide customer support</li>
            </ul>

            <h4>3. Data Storage and Security</h4>

            <p><strong>Storage:</strong></p>
            <ul>
              <li>Data is stored on secure cloud servers</li>
              <li>Location data is retained for 90 days</li>
              <li>Task photos are retained indefinitely for business records</li>
              <li>Account information is retained while employed</li>
            </ul>

            <p><strong>Security Measures:</strong></p>
            <ul>
              <li>End-to-end encryption for data transmission</li>
              <li>Secure authentication system</li>
              <li>Regular security audits</li>
              <li>Access controls and employee training</li>
              <li>Automatic session timeouts</li>
            </ul>

            <h4>4. Data Sharing</h4>
            <p>We do not sell, trade, or rent your personal information. We may share your information only in the following situations:</p>
            <ul>
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>With service providers who assist in app operations (under confidentiality agreements)</li>
              <li>During company audits or inspections</li>
            </ul>

            <h4>5. Your Rights</h4>
            <p>As an employee using Nam Việt Internal, you have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of data (subject to business requirements)</li>
              <li>Opt-out of non-essential data collection</li>
              <li>Receive a copy of your data</li>
            </ul>
            <p>To exercise these rights, contact our Privacy Officer at: <a href="mailto:dienlanhnamviet.vn@gmail.com">dienlanhnamviet.vn@gmail.com</a></p>

            <h4>6. Location Services</h4>
            <p>The App requires location services for core functionality:</p>
            <ul>
              <li>GPS verification is mandatory for check-in/check-out</li>
              <li>Location accuracy threshold is 100 meters</li>
              <li>Location is only accessed during app use</li>
              <li>You can disable location services, but check-in features will be unavailable</li>
            </ul>

            <h4>7. Camera and Photos</h4>
            <ul>
              <li>Camera access is required for task documentation</li>
              <li>Photos are uploaded to company servers</li>
              <li>Photos become part of business records</li>
              <li>You control when photos are taken</li>
              <li>Gallery access is optional</li>
            </ul>

            <h4>8. Data Retention</h4>
            <ul>
              <li><strong>Active employee data:</strong> Retained during employment</li>
              <li><strong>Terminated employee data:</strong> Archived after 30 days</li>
              <li><strong>Business records:</strong> Retained per legal requirements (typically 5 years)</li>
              <li><strong>Technical logs:</strong> Retained for 90 days</li>
            </ul>

            <h4>9. Children's Privacy</h4>
            <p>Nam Việt Internal is not intended for use by anyone under 18 years of age. We do not knowingly collect data from children.</p>

            <h4>10. Changes to This Policy</h4>
            <p>We may update this Privacy Policy from time to time. Changes will be notified through the App. Continued use after changes constitutes acceptance.</p>

            <h4>11. Contact Information</h4>
            <div class="contact-info">
              <p><strong>Email:</strong> <a href="mailto:dienlanhnamviet.vn@gmail.com">dienlanhnamviet.vn@gmail.com</a></p>
              <p><strong>Phone:</strong> 0947 548 561</p>
              <p><strong>Address:</strong> 453 Âu Cơ Street, Nhật Tân Ward, Tây Hồ District, Hà Nội, Vietnam</p>
            </div>
          </section>

          <!-- Vietnamese Version -->
          <section class="language-section" id="vietnamese">
            <h2>Vietnamese Version (Tiếng Việt)</h2>

            <h3>Chính Sách Bảo Mật - Nam Việt Internal</h3>
            <p><strong>Ngày hiệu lực:</strong> 06 tháng 11 năm 2025</p>

            <p>
              CÔNG TY TNHH THƯƠNG MẠI VÀ ĐIỆN LẠNH NAM VIỆT ("Nam Việt", "chúng tôi") cam kết bảo vệ quyền riêng tư của nhân viên sử dụng ứng dụng Nam Việt Internal ("Ứng dụng"). Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn.
            </p>

            <h4>1. Thông Tin Chúng Tôi Thu Thập</h4>

            <p><strong>Thông tin cá nhân:</strong></p>
            <ul>
              <li>Họ tên và mã nhân viên</li>
              <li>Địa chỉ email</li>
              <li>Số điện thoại (nếu có)</li>
              <li>Thông tin đăng nhập</li>
            </ul>

            <p><strong>Thông tin vị trí:</strong></p>
            <ul>
              <li>Dữ liệu GPS chính xác cho check-in/check-out</li>
              <li>Lịch sử vị trí trong giờ làm việc</li>
              <li>Tọa độ địa điểm công việc</li>
            </ul>

            <p><strong>Hình ảnh và tệp tin:</strong></p>
            <ul>
              <li>Ảnh chụp qua Ứng dụng để báo cáo công việc</li>
              <li>Ảnh từ thư viện để đính kèm nhiệm vụ</li>
              <li>Tệp đính kèm liên quan công việc</li>
            </ul>

            <p><strong>Thông tin thiết bị:</strong></p>
            <ul>
              <li>Loại thiết bị</li>
              <li>Phiên bản hệ điều hành</li>
              <li>Phiên bản ứng dụng</li>
              <li>Mã định danh thiết bị</li>
              <li>Thông tin mạng</li>
            </ul>

            <p><strong>Dữ liệu sử dụng:</strong></p>
            <ul>
              <li>Tương tác với ứng dụng</li>
              <li>Thống kê sử dụng tính năng</li>
              <li>Số liệu hoàn thành công việc</li>
              <li>Thời gian check-in/check-out</li>
              <li>Báo cáo lỗi</li>
            </ul>

            <h4>2. Cách Chúng Tôi Sử Dụng Thông Tin</h4>

            <p><strong>Chức năng chính:</strong></p>
            <ul>
              <li>Xác minh vị trí nhân viên khi check-in/check-out</li>
              <li>Lưu trữ hình ảnh công việc</li>
              <li>Phân công và quản lý nhiệm vụ</li>
              <li>Theo dõi giờ làm việc</li>
              <li>Tạo báo cáo hiệu suất</li>
            </ul>

            <p><strong>Hoạt động kinh doanh:</strong></p>
            <ul>
              <li>Giám sát chất lượng dịch vụ</li>
              <li>Tính toán thanh toán và hoa hồng</li>
              <li>Cải thiện hiệu quả phân công</li>
              <li>Đảm bảo tuân thủ quy định</li>
            </ul>

            <p><strong>Cải thiện ứng dụng:</strong></p>
            <ul>
              <li>Sửa lỗi kỹ thuật</li>
              <li>Phân tích hiệu suất</li>
              <li>Phát triển tính năng mới</li>
              <li>Hỗ trợ người dùng</li>
            </ul>

            <h4>3. Lưu Trữ và Bảo Mật Dữ Liệu</h4>

            <p><strong>Lưu trữ:</strong></p>
            <ul>
              <li>Dữ liệu được lưu trên máy chủ đám mây an toàn</li>
              <li>Dữ liệu vị trí lưu 90 ngày</li>
              <li>Ảnh công việc lưu trữ vĩnh viễn</li>
              <li>Thông tin tài khoản lưu trong thời gian làm việc</li>
            </ul>

            <p><strong>Biện pháp bảo mật:</strong></p>
            <ul>
              <li>Mã hóa đầu cuối khi truyền dữ liệu</li>
              <li>Hệ thống xác thực an toàn</li>
              <li>Kiểm tra bảo mật định kỳ</li>
              <li>Kiểm soát truy cập</li>
              <li>Tự động đăng xuất</li>
            </ul>

            <h4>4. Chia Sẻ Dữ Liệu</h4>
            <p>Chúng tôi không bán hoặc cho thuê thông tin cá nhân. Chỉ chia sẻ trong các trường hợp:</p>
            <ul>
              <li>Có sự đồng ý của bạn</li>
              <li>Tuân thủ pháp luật</li>
              <li>Bảo vệ quyền lợi công ty</li>
              <li>Với đối tác cung cấp dịch vụ (có thỏa thuận bảo mật)</li>
              <li>Trong kiểm toán nội bộ</li>
            </ul>

            <h4>5. Quyền Của Bạn</h4>
            <p>Bạn có quyền:</p>
            <ul>
              <li>Truy cập dữ liệu cá nhân</li>
              <li>Yêu cầu sửa thông tin sai</li>
              <li>Yêu cầu xóa dữ liệu (tùy yêu cầu kinh doanh)</li>
              <li>Từ chối thu thập dữ liệu không cần thiết</li>
              <li>Nhận bản sao dữ liệu</li>
            </ul>
            <p>Liên hệ: <a href="mailto:dienlanhnamviet.vn@gmail.com">dienlanhnamviet.vn@gmail.com</a></p>

            <h4>6. Dịch Vụ Định Vị</h4>
            <ul>
              <li>GPS bắt buộc cho check-in/check-out</li>
              <li>Ngưỡng chính xác 100 mét</li>
              <li>Chỉ truy cập khi dùng ứng dụng</li>
              <li>Tắt định vị sẽ không dùng được check-in</li>
            </ul>

            <h4>7. Camera và Ảnh</h4>
            <ul>
              <li>Camera cần thiết cho báo cáo công việc</li>
              <li>Ảnh được tải lên máy chủ công ty</li>
              <li>Ảnh là hồ sơ kinh doanh</li>
              <li>Bạn kiểm soát khi chụp ảnh</li>
              <li>Truy cập thư viện là tùy chọn</li>
            </ul>

            <h4>8. Thời Gian Lưu Trữ</h4>
            <ul>
              <li><strong>Nhân viên đang làm:</strong> Lưu trong thời gian làm việc</li>
              <li><strong>Nhân viên nghỉ việc:</strong> Lưu trữ sau 30 ngày</li>
              <li><strong>Hồ sơ kinh doanh:</strong> Theo quy định pháp luật (5 năm)</li>
              <li><strong>Nhật ký kỹ thuật:</strong> 90 ngày</li>
            </ul>

            <h4>9. Quyền Riêng Tư Trẻ Em</h4>
            <p>Ứng dụng không dành cho người dưới 18 tuổi. Chúng tôi không thu thập dữ liệu trẻ em.</p>

            <h4>10. Thay Đổi Chính Sách</h4>
            <p>Chúng tôi có thể cập nhật chính sách này. Thay đổi sẽ thông báo qua Ứng dụng. Tiếp tục sử dụng là đồng ý thay đổi.</p>

            <h4>11. Thông Tin Liên Hệ</h4>
            <div class="contact-info">
              <p><strong>Email:</strong> <a href="mailto:dienlanhnamviet.vn@gmail.com">dienlanhnamviet.vn@gmail.com</a></p>
              <p><strong>Điện thoại:</strong> 0947 548 561</p>
              <p><strong>Địa chỉ:</strong> 453 Âu Cơ, Nhật Tân, Tây Hồ, Hà Nội, Việt Nam</p>
            </div>
          </section>

          <footer>
            <p>&copy; 2025 CÔNG TY TNHH THƯƠNG MẠI VÀ ĐIỆN LẠNH NAM VIỆT. All rights reserved.</p>
            <p>698 Truong Chinh, Tan Binh, Ho Chi Minh City, Vietnam 700000</p>
          </footer>
        </div>
      </body>
    </html>
  `)
})

export default router
