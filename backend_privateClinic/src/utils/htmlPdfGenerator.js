const htmlPdf = require('html-pdf-node');
const { format } = require('date-fns');
const { vi } = require('date-fns/locale');

/**
 * Lớp tiện ích để tạo hóa đơn PDF từ HTML với hỗ trợ tiếng Việt đầy đủ
 */
class HtmlPdfGenerator {
  /**
   * Tạo hóa đơn PDF từ template HTML và gửi đến response
   * @param {Object} res - Express response object
   * @param {Object} data - Dữ liệu hóa đơn và các thông tin liên quan
   */
  static async generateInvoice(res, data) {
    try {
      const { invoice, prescriptions, clinicInfo } = data;
      
      // Định dạng ngày tháng kiểu Việt Nam
      const formatDate = (dateString) => {
        if (!dateString) return 'Chưa có';
        return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
      };
      
      // Tạo HTML template cho hóa đơn
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Hóa đơn khám bệnh - ${invoice.id}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 0;
              color: #333;
              font-size: 0.95em;
              width: 100%;
              box-sizing: border-box;
            }
            .invoice-container {
              width: 100%;
              margin: 0 auto;
              padding: 15px;
              box-sizing: border-box;
            }
            .invoice-header {
              text-align: center;
              margin-bottom: 20px;
            }
            .invoice-title {
              font-size: 22px;
              font-weight: bold;
              margin-bottom: 4px;
              color: #2e86de;
            }
            .clinic-info {
              margin-bottom: 5px;
            }
            .separator {
              margin: 15px 0;
              border-top: 1px solid #ddd;
            }
            .invoice-details {
              text-align: right;
              margin-bottom: 20px;
            }
            .patient-info, .examination-info {
              margin-bottom: 20px;
            }
            .section-title {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 8px;
              background-color: #f1f1f1;
              padding: 4px;
            }
            .info-row {
              margin-bottom: 5px;
            }
            .medicines-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .medicines-table th, .medicines-table td {
              border: 1px solid #ddd;
              padding: 6px;
              text-align: left;
            }
            .medicines-table th {
              background-color: #f1f1f1;
            }
            .medicines-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .total-section {
              margin-top: 20px;
              text-align: right;
            }
            .total-row {
              margin-bottom: 5px;
            }
            .total-amount {
              font-weight: bold;
              font-size: 14px;
              color: #2e86de;
            }
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
            }
            .signature-box {
              width: 40%;
              text-align: center;
            }
            .signature-title {
              font-weight: bold;
              margin-bottom: 5px;
            }
            .signature-name {
              margin-top: 50px;
            }
            .footer-note {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #777;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="invoice-header">
              <div class="invoice-title">HÓA ĐƠN KHÁM BỆNH</div>
              <div class="clinic-info">${clinicInfo.name}</div>
              <div class="clinic-info">${clinicInfo.address}</div>
              <div class="clinic-info">Điện thoại: ${clinicInfo.phone} - Email: ${clinicInfo.email}</div>
            </div>
            
            <div class="separator"></div>
            
            <div class="invoice-details">
              <div><strong>Mã hóa đơn:</strong> ${invoice.id}</div>
              <div><strong>Ngày thanh toán:</strong> ${invoice.payment_date ? formatDate(invoice.payment_date) : 'Chưa thanh toán'}</div>
              <div><strong>Trạng thái:</strong> ${invoice.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</div>
            </div>
            
            <div class="patient-info">
              <div class="section-title">THÔNG TIN BỆNH NHÂN</div>
              <div class="info-row"><strong>Họ và tên:</strong> ${invoice.patient_name}</div>
              <div class="info-row"><strong>Giới tính:</strong> ${invoice.gender}</div>
              <div class="info-row"><strong>Năm sinh:</strong> ${invoice.birth_year}</div>
              <div class="info-row"><strong>Điện thoại:</strong> ${invoice.phone || 'Không có'}</div>
              <div class="info-row"><strong>Địa chỉ:</strong> ${invoice.address || 'Không có'}</div>
            </div>
            
            <div class="examination-info">
              <div class="section-title">THÔNG TIN KHÁM BỆNH</div>
              <div class="info-row"><strong>Ngày khám:</strong> ${formatDate(invoice.examination_date)}</div>
              <div class="info-row"><strong>Triệu chứng:</strong> ${invoice.symptoms || 'Không có'}</div>
              <div class="info-row"><strong>Chẩn đoán:</strong> ${invoice.diagnosis || 'Không có'}</div>
              <div class="info-row"><strong>Loại bệnh:</strong> ${invoice.disease_name || 'Không xác định'}</div>
            </div>
            
            <div class="medicines-section">
              <div class="section-title">DANH SÁCH THUỐC</div>
              <table class="medicines-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Tên thuốc</th>
                    <th>Cách dùng</th>
                    <th>Số lượng</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  ${prescriptions && prescriptions.length > 0 ? 
                    prescriptions.map((prescription, index) => `
                      <tr>
                        <td>${index + 1}</td>
                        <td>${prescription.medicine_name}</td>
                        <td>${prescription.usage_instruction}</td>
                        <td>${prescription.quantity}</td>
                        <td>${prescription.medicine_price.toLocaleString('vi-VN')}</td>
                        <td>${prescription.subtotal.toLocaleString('vi-VN')}</td>
                      </tr>
                    `).join('') : 
                    '<tr><td colspan="6" style="text-align: center;">Không có thuốc trong đơn</td></tr>'
                  }
                </tbody>
              </table>
            </div>
            
            <div class="total-section">
              <div class="total-row">
                <strong>Tiền khám:</strong> ${invoice.examination_fee.toLocaleString('vi-VN')} VNĐ
              </div>
              <div class="total-row">
                <strong>Tiền thuốc:</strong> ${invoice.medicine_fee.toLocaleString('vi-VN')} VNĐ
              </div>
              <div class="separator" style="width: 200px; margin-left: auto;"></div>
              <div class="total-row total-amount">
                <strong>Tổng thanh toán:</strong> ${invoice.total_fee.toLocaleString('vi-VN')} VNĐ
              </div>
            </div>
            
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-title">Người lập hóa đơn</div>
                <div>(Ký, ghi rõ họ tên)</div>
                <div class="signature-name">${invoice.staff_name}</div>
              </div>
              <div class="signature-box">
                <div class="signature-title">Bệnh nhân</div>
                <div>(Ký, ghi rõ họ tên)</div>
                <div class="signature-name">${invoice.patient_name}</div>
              </div>
            </div>
            
            <div class="footer-note">
              Lưu ý: Hóa đơn điện tử này có giá trị pháp lý tương đương hóa đơn giấy.
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Cấu hình PDF
      const options = {
        format: 'A4',
        scale: 1.0,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        },
        printBackground: true,
        preferCSSPageSize: true,
        width: '210mm',
        height: '297mm'
      };
      
      // Tạo nội dung HTML cho PDF
      const file = { content: htmlContent };
      
      // Tạo PDF từ HTML
      const pdfBuffer = await htmlPdf.generatePdf(file, options);
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.id}.pdf`);
      
      // Gửi PDF về client
      res.send(pdfBuffer);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }
}

module.exports = HtmlPdfGenerator;
