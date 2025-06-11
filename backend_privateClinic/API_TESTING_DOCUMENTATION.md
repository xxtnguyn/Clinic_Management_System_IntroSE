# API Testing Documentation - Private Clinic Management System

## Tổng quan

Tài liệu này cung cấp hướng dẫn toàn diện để kiểm thử API cho hệ thống quản lý phòng khám tư nhân. Nó bao gồm các phương pháp kiểm thử, công cụ được đề xuất và các test case chi tiết cho từng API endpoint.

## Nội dung

1. [Mục tiêu và phạm vi](#mục-tiêu-và-phạm-vi)
2. [Môi trường kiểm thử](#môi-trường-kiểm-thử)
3. [Công cụ kiểm thử](#công-cụ-kiểm-thử)
4. [Quy trình kiểm thử](#quy-trình-kiểm-thử)
5. [Test Cases theo API Endpoint](#test-cases-theo-api-endpoint)
6. [Authentication](#authentication)

## Mục tiêu và phạm vi

### Mục tiêu:
- Đảm bảo tất cả API endpoint hoạt động chính xác theo yêu cầu thiết kế
- Xác minh xử lý lỗi và phản hồi phù hợp
- Kiểm tra tính bảo mật và phân quyền trong hệ thống
- Xác nhận luồng dữ liệu và tích hợp giữa các thành phần

### Phạm vi:
- Tất cả API endpoint trong hệ thống
- Kiểm thử cơ bản và nâng cao bao gồm:
  - Xác thực (Authentication)
  - Quản lý bệnh nhân
  - Quản lý lịch hẹn
  - Quản lý hồ sơ y tế
  - Quản lý thuốc và đơn thuốc
  - Quản lý hóa đơn và thanh toán
  - Quản lý nhân viên và phân quyền
  - Quản lý cài đặt hệ thống
  - Báo cáo thống kê

## Môi trường kiểm thử

Thiết lập các môi trường kiểm thử sau:

1. **Local**: Môi trường phát triển cục bộ
   - URL: `http://localhost:3000/api`
   
2. **Development**: Môi trường phát triển dùng chung
   - URL: `https://dev-clinic-api.example.com/api`
   
3. **Staging**: Môi trường kiểm thử trước khi đưa vào sản phẩm
   - URL: `https://staging-clinic-api.example.com/api`
   
4. **Production**: Môi trường sản phẩm
   - URL: `https://clinic-api.example.com/api`

## Công cụ kiểm thử

### Công cụ chính:

**Postman**: Được sử dụng để kiểm thử API một cách toàn diện. Postman cho phép:
- Tạo và lưu các request API
- Thiết lập môi trường và biến
- Tạo bộ sưu tập test có thể tái sử dụng
- Tự động hóa quy trình kiểm thử
- Tạo báo cáo kết quả kiểm thử

### Cài đặt và cấu hình:

1. Tải và cài đặt Postman từ [trang chủ Postman](https://www.postman.com/downloads/)
2. Nhập bộ sưu tập API từ file `PrivateClinic.postman_collection.json`
3. Nhập biến môi trường từ file `Local.postman_environment.json`

## Quy trình kiểm thử

1. **Kiểm thử đơn vị (Unit Testing)**:
   - Kiểm thử từng endpoint API riêng lẻ
   - Xác minh kết quả trả về đúng định dạng và giá trị mong đợi

2. **Kiểm thử tích hợp (Integration Testing)**:
   - Kiểm thử các luồng xử lý hoàn chỉnh qua nhiều API
   - Xác minh tương tác giữa các thành phần hệ thống

3. **Kiểm thử API đầu cuối (API Endpoint Testing)**:
   - Kiểm thử từng API endpoint với các trường hợp dữ liệu đầu vào khác nhau
   - Kiểm tra mã trạng thái HTTP, định dạng phản hồi và nội dung phản hồi

## Test Cases theo API Endpoint

### 1. Authentication APIs

#### 1.1 Đăng nhập: POST /api/staff/login

**Input**:
```json
{
  "username": "admin01",
  "password": "123456"
}
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin01",
      "fullName": "Admin User",
      "email": "admin@example.com",
      "phone": "0987654321",
      "role": {
        "id": 1,
        "name": "Admin"
      },
      "isActive": true
    }
  }
}
}
```

**Test Cases**:
- ✅ **TC001**: Đăng nhập thành công với thông tin đúng.
- ❌ **TC002**: Username không tồn tại.
- ❌ **TC003**: Mật khẩu không đúng.
- ❌ **TC004**: Tài khoản đã bị khóa (`is_active = false`).

#### 1.2 Lấy thông tin người dùng hiện tại: GET /api/auth/me

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Expected Output**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin01",
    "full_name": "Admin User",
    "email": "admin@example.com",
    "phone": "0901234567",
    "address": "123 Main St",
    "birth_date": "1990-01-01T00:00:00.000Z",
    "gender": "Nam",
    "role_id": 1,
    "role_name": "Admin",
    "is_active": true,
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC005**: Lấy thông tin người dùng thành công với token hợp lệ.
- ❌ **TC006**: Token không hợp lệ.
- ❌ **TC007**: Token đã hết hạn.

#### 1.2 Đổi mật khẩu: POST /api/staff/change-password

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Input**:
```json
{
  "current_password": "123456",
  "new_password": "NewSecurePassword123!",
  "confirm_password": "NewSecurePassword123!"
}
```

**Validation Rules**:
- `current_password`: Bắt buộc, phải khớp với mật khẩu hiện tại
- `new_password`: Bắt buộc, ít nhất 6 ký tự, không được trùng với mật khẩu hiện tại
- `confirm_password`: Bắt buộc, phải khớp với new_password

**Expected Output (Thành công)**:
```json
{
  "success": true,
  "message": "Đổi mật khẩu thành công"
}
```

**Error Responses**:
1. Mật khẩu hiện tại không đúng:
```json
{
  "success": false,
  "message": "Mật khẩu hiện tại không đúng"
}
```

2. Xác thực thất bại (thiếu token hoặc token không hợp lệ):
```json
{
  "success": false,
  "message": "Chưa xác thực"
}
```

**Test Cases**:
- ✅ **TC008**: Đổi mật khẩu thành công.
- ❌ **TC009**: Mật khẩu hiện tại không đúng.
- ❌ **TC010**: Mật khẩu mới không đáp ứng yêu cầu an toàn (ít nhất 6 ký tự).

### 2. Patient APIs

#### 2.1 Lấy danh sách bệnh nhân: GET /api/patients

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `search`: Tìm kiếm theo tên, SĐT hoặc địa chỉ (optional)
- `page`: Số trang (optional, default: 1)
- `limit`: Số bản ghi mỗi trang (optional, default: 10)

**Expected Output**:
```json
{
  "success": true,
  "data": {
    "patients": [
      {
        "id": 1,
        "full_name": "Nguyễn Văn A",
        "gender": "Nam",
        "birth_year": 1990,
        "phone": "0901234567",
        "address": "123 Đường Lê Lợi, Quận 1, TP.HCM",
        "created_at": "2025-01-01T00:00:00.000Z",
        "updated_at": "2025-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

**Test Cases**:
- ✅ **TC011**: Lấy danh sách bệnh nhân thành công.
- ✅ **TC012**: Tìm kiếm bệnh nhân theo tên.
- ✅ **TC013**: Phân trang hoạt động đúng.
- ❌ **TC014**: Không có quyền truy cập.

#### 2.2 Lấy thông tin bệnh nhân theo ID: GET /api/patients/:id

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Expected Output**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "full_name": "Nguyễn Văn A",
    "gender": "Nam",
    "birth_year": 1990,
    "phone": "0901234567",
    "address": "123 Đường Lê Lợi, Quận 1, TP.HCM",
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC015**: Lấy thông tin bệnh nhân thành công.
- ❌ **TC016**: ID bệnh nhân không tồn tại.
- ❌ **TC017**: Không có quyền truy cập.

#### 2.3 Tạo bệnh nhân mới: POST /api/patients

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Input**:
```json
{
  "full_name": "Nguyễn Văn A",
  "gender": "Nam",
  "birth_year": 1990,
  "phone": "0901234567",
  "address": "123 Đường Lê Lợi, Quận 1, TP.HCM"
}
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Bệnh nhân đã được tạo thành công",
  "data": {
    "id": 1,
    "full_name": "Nguyễn Văn A",
    "gender": "Nam",
    "birth_year": 1990,
    "phone": "0901234567",
    "address": "123 Đường Lê Lợi, Quận 1, TP.HCM",
    "created_at": "2025-05-03T04:34:49.000Z",
    "updated_at": "2025-05-03T04:34:49.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC018**: Tạo bệnh nhân mới thành công.
- ❌ **TC019**: Thiếu thông tin bắt buộc.
- ❌ **TC020**: Định dạng dữ liệu không hợp lệ.
- ❌ **TC021**: Không có quyền truy cập.

#### 2.4 Cập nhật thông tin bệnh nhân: PUT /api/patients/:id

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Input**:
```json
{
  "full_name": "Nguyễn Văn A",
  "phone": "0901234567",
  "address": "456 Đường Nguyễn Huệ, Quận 1, TP.HCM"
}
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Thông tin bệnh nhân đã được cập nhật",
  "data": {
    "id": 1,
    "full_name": "Nguyễn Văn A",
    "gender": "Nam",
    "birth_year": 1990,
    "phone": "0901234567",
    "address": "456 Đường Nguyễn Huệ, Quận 1, TP.HCM",
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-05-03T04:34:49.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC022**: Cập nhật thông tin bệnh nhân thành công.
- ❌ **TC023**: ID bệnh nhân không tồn tại.
- ❌ **TC024**: Định dạng dữ liệu không hợp lệ.
- ❌ **TC025**: Không có quyền truy cập.

#### 2.5 Xóa bệnh nhân: DELETE /api/patients/:id

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Bệnh nhân đã được xóa thành công"
}
```

**Test Cases**:
- ✅ **TC026**: Xóa bệnh nhân thành công.
- ❌ **TC027**: ID bệnh nhân không tồn tại.
- ❌ **TC028**: Bệnh nhân đã có dữ liệu liên kết (lịch hẹn, hồ sơ y tế).
- ❌ **TC029**: Không có quyền truy cập.

### 3. Appointment APIs

#### 3.1 Lấy danh sách lịch hẹn: GET /api/appointments

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `date`: Lọc theo ngày (YYYY-MM-DD, optional)
- `status`: Lọc theo trạng thái (waiting, in_progress, completed, cancelled, no_show, optional)
- `patientId`: Lọc theo ID bệnh nhân (optional)
- `page`: Số trang (optional, default: 1)
- `limit`: Số bản ghi mỗi trang (optional, default: 10)

**Expected Output**:
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": 1,
        "patient_id": 1,
        "patient_name": "Nguyễn Văn A",
        "appointment_date": "2025-05-15",
        "appointment_time": "09:00:00",
        "status": "waiting",
        "notes": "Khám sức khỏe định kỳ",
        "created_at": "2025-05-01T00:00:00.000Z",
        "updated_at": "2025-05-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

**Test Cases**:
- ✅ **TC030**: Lấy danh sách lịch hẹn thành công.
- ✅ **TC031**: Lọc lịch hẹn theo ngày.
- ✅ **TC032**: Lọc lịch hẹn theo trạng thái.
- ✅ **TC033**: Lọc lịch hẹn theo bệnh nhân.
- ❌ **TC034**: Không có quyền truy cập.

#### 3.2 Lấy thông tin lịch hẹn theo ID: GET /api/appointments/:id

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Expected Output**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "patient_id": 1,
    "patient_name": "Nguyễn Văn A",
    "appointment_date": "2025-05-15",
    "appointment_time": "09:00:00",
    "status": "waiting",
    "notes": "Khám sức khỏe định kỳ",
    "created_at": "2025-05-01T00:00:00.000Z",
    "updated_at": "2025-05-01T00:00:00.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC035**: Lấy thông tin lịch hẹn thành công.
- ❌ **TC036**: ID lịch hẹn không tồn tại.
- ❌ **TC037**: Không có quyền truy cập.

#### 3.3 Tạo lịch hẹn mới: POST /api/appointments

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Input**:
```json
{
  "patient_id": 1,
  "appointment_date": "2025-05-15",
  "appointment_time": "09:00:00",
  "notes": "Khám sức khỏe định kỳ"
}
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Lịch hẹn đã được tạo thành công",
  "data": {
    "id": 1,
    "patient_id": 1,
    "appointment_date": "2025-05-15",
    "appointment_time": "09:00:00",
    "status": "waiting",
    "notes": "Khám sức khỏe định kỳ",
    "created_at": "2025-05-03T04:34:49.000Z",
    "updated_at": "2025-05-03T04:34:49.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC038**: Tạo lịch hẹn mới thành công.
- ❌ **TC039**: Thiếu thông tin bắt buộc.
- ❌ **TC040**: Đặt lịch cho ngày trong quá khứ.
- ❌ **TC041**: Vượt quá số lượng bệnh nhân tối đa trong ngày.
- ❌ **TC042**: ID bệnh nhân không tồn tại.
- ❌ **TC043**: Không có quyền truy cập.

#### 3.4 Cập nhật lịch hẹn: PUT /api/appointments/:id

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Input**:
```json
{
  "appointment_date": "2025-05-20",
  "appointment_time": "10:30:00",
  "notes": "Đổi lịch theo yêu cầu của bệnh nhân"
}
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Lịch hẹn đã được cập nhật",
  "data": {
    "id": 1,
    "patient_id": 1,
    "appointment_date": "2025-05-20",
    "appointment_time": "10:30:00",
    "status": "waiting",
    "notes": "Đổi lịch theo yêu cầu của bệnh nhân",
    "created_at": "2025-05-01T00:00:00.000Z",
    "updated_at": "2025-05-03T04:34:49.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC044**: Cập nhật lịch hẹn thành công.
- ❌ **TC045**: ID lịch hẹn không tồn tại.
- ❌ **TC046**: Đổi lịch sang ngày trong quá khứ.
- ❌ **TC047**: Vượt quá số lượng bệnh nhân tối đa trong ngày mới.
- ❌ **TC048**: Không có quyền truy cập.

#### 3.5 Hủy lịch hẹn: PATCH /api/appointments/:id/cancel

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Lịch hẹn đã được hủy",
  "data": {
    "id": 1,
    "patient_id": 1,
    "appointment_date": "2025-05-20",
    "appointment_time": "10:30:00",
    "status": "cancelled",
    "notes": "Đổi lịch theo yêu cầu của bệnh nhân",
    "created_at": "2025-05-01T00:00:00.000Z",
    "updated_at": "2025-05-03T04:34:49.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC049**: Hủy lịch hẹn thành công.
- ❌ **TC050**: ID lịch hẹn không tồn tại.
- ❌ **TC051**: Lịch hẹn đã hoàn thành hoặc đã hủy trước đó.
- ❌ **TC052**: Không có quyền truy cập.

### 4. Medical Record APIs

#### 4.1 Lấy danh sách hồ sơ y tế: GET /api/medical-records

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `patientId`: Lọc theo ID bệnh nhân (optional)
- `staffId`: Lọc theo ID nhân viên (optional)
- `startDate`, `endDate`: Lọc theo khoảng thời gian (optional)
- `diseaseTypeId`: Lọc theo loại bệnh (optional)
- `status`: Lọc theo trạng thái (optional)
- `page`: Số trang (optional, default: 1)
- `limit`: Số bản ghi mỗi trang (optional, default: 10)

**Expected Output**:
```json
{
  "success": true,
  "data": {
    "medical_records": [
      {
        "id": 1,
        "patient_id": 1,
        "patient_name": "Nguyễn Văn A",
        "staff_id": 2,
        "staff_name": "Bác sĩ B",
        "examination_date": "2025-05-03",
        "symptoms": "Sốt, ho, đau đầu",
        "diagnosis": "Cảm cúm thông thường",
        "disease_type_id": 1,
        "disease_type_name": "Nhiễm trùng đường hô hấp",
        "status": "completed",
        "notes": "Cần nghỉ ngơi, uống nhiều nước",
        "created_at": "2025-05-03T00:00:00.000Z",
        "updated_at": "2025-05-03T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 70,
      "page": 1,
      "limit": 10,
      "totalPages": 7
    }
  }
}
```

**Test Cases**:
- ✅ **TC053**: Lấy danh sách hồ sơ y tế thành công.
- ✅ **TC054**: Lọc hồ sơ y tế theo bệnh nhân.
- ✅ **TC055**: Lọc hồ sơ y tế theo nhân viên.
- ✅ **TC056**: Lọc hồ sơ y tế theo khoảng thời gian.
- ❌ **TC057**: Không có quyền truy cập.

#### 4.2 Lấy thông tin hồ sơ y tế theo ID: GET /api/medical-records/:id

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Expected Output**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "patient_id": 1,
    "patient_name": "Nguyễn Văn A",
    "staff_id": 2,
    "staff_name": "Bác sĩ B",
    "examination_date": "2025-05-03",
    "symptoms": "Sốt, ho, đau đầu",
    "diagnosis": "Cảm cúm thông thường",
    "disease_type_id": 1,
    "disease_type_name": "Nhiễm trùng đường hô hấp",
    "status": "completed",
    "notes": "Cần nghỉ ngơi, uống nhiều nước",
    "created_at": "2025-05-03T00:00:00.000Z",
    "updated_at": "2025-05-03T00:00:00.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC058**: Lấy thông tin hồ sơ y tế thành công.
- ❌ **TC059**: ID hồ sơ y tế không tồn tại.
- ❌ **TC060**: Không có quyền truy cập.

#### 4.3 Tạo hồ sơ y tế mới: POST /api/medical-records

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Input**:
```json
{
  "patient_id": 1,
  "examination_date": "2025-05-03",
  "symptoms": "Sốt, ho, đau đầu",
  "diagnosis": "Cảm cúm thông thường",
  "disease_type_id": 1,
  "status": "completed",
  "notes": "Cần nghỉ ngơi, uống nhiều nước"
}
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Hồ sơ y tế đã được tạo thành công",
  "data": {
    "id": 1,
    "patient_id": 1,
    "staff_id": 2,
    "examination_date": "2025-05-03",
    "symptoms": "Sốt, ho, đau đầu",
    "diagnosis": "Cảm cúm thông thường",
    "disease_type_id": 1,
    "status": "completed",
    "notes": "Cần nghỉ ngơi, uống nhiều nước",
    "created_at": "2025-05-03T04:34:49.000Z",
    "updated_at": "2025-05-03T04:34:49.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC061**: Tạo hồ sơ y tế mới thành công.
- ❌ **TC062**: Thiếu thông tin bắt buộc.
- ❌ **TC063**: ID bệnh nhân không tồn tại.
- ❌ **TC064**: ID loại bệnh không tồn tại.
- ❌ **TC065**: Không có quyền truy cập.

#### 4.4 Cập nhật hồ sơ y tế: PUT /api/medical-records/:id

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Input**:
```json
{
  "symptoms": "Sốt cao, ho nhiều, đau đầu",
  "diagnosis": "Viêm phổi",
  "disease_type_id": 2,
  "status": "completed",
  "notes": "Cần dùng thuốc đầy đủ, theo dõi sát"
}
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Hồ sơ y tế đã được cập nhật",
  "data": {
    "id": 1,
    "patient_id": 1,
    "staff_id": 2,
    "examination_date": "2025-05-03",
    "symptoms": "Sốt cao, ho nhiều, đau đầu",
    "diagnosis": "Viêm phổi",
    "disease_type_id": 2,
    "status": "completed",
    "notes": "Cần dùng thuốc đầy đủ, theo dõi sát",
    "created_at": "2025-05-03T00:00:00.000Z",
    "updated_at": "2025-05-03T04:34:49.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC066**: Cập nhật hồ sơ y tế thành công.
- ❌ **TC067**: ID hồ sơ y tế không tồn tại.
- ❌ **TC068**: ID loại bệnh không tồn tại.
- ❌ **TC069**: Không có quyền truy cập.

#### 4.5 Cập nhật trạng thái hồ sơ y tế: PATCH /api/medical-records/:id/status

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Input**:
```json
{
  "status": "completed"
}
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Trạng thái hồ sơ y tế đã được cập nhật",
  "data": {
    "id": 1,
    "status": "completed",
    "updated_at": "2025-05-03T04:34:49.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC070**: Cập nhật trạng thái thành công.
- ❌ **TC071**: ID hồ sơ y tế không tồn tại.
- ❌ **TC072**: Trạng thái không hợp lệ.
- ❌ **TC073**: Không có quyền truy cập.

### 5. Medicine APIs

#### 5.1 Lấy danh sách thuốc: GET /api/medicines

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `search`: Tìm kiếm theo tên (optional)
- `unit`: Lọc theo đơn vị (optional)
- `lowStock`: Lọc thuốc có số lượng thấp (optional, true/false)
- `page`: Số trang (optional, default: 1)
- `limit`: Số bản ghi mỗi trang (optional, default: 10)

**Expected Output**:
```json
{
  "success": true,
  "data": {
    "medicines": [
      {
        "id": 1,
        "name": "Paracetamol 500mg",
        "unit": "viên",
        "price": 2000,
        "quantity_in_stock": 100,
        "description": "Thuốc giảm đau, hạ sốt",
        "created_at": "2025-01-01T00:00:00.000Z",
        "updated_at": "2025-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 200,
      "page": 1,
      "limit": 10,
      "totalPages": 20
    }
  }
}
```

**Test Cases**:
- ✅ **TC074**: Lấy danh sách thuốc thành công.
- ✅ **TC075**: Tìm kiếm thuốc theo tên.
- ✅ **TC076**: Lọc thuốc theo đơn vị.
- ✅ **TC077**: Lọc thuốc có số lượng thấp.
- ❌ **TC078**: Không có quyền truy cập.

#### 5.2 Lấy thông tin thuốc theo ID: GET /api/medicines/:id

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Expected Output**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Paracetamol 500mg",
    "unit": "viên",
    "price": 2000,
    "quantity_in_stock": 100,
    "description": "Thuốc giảm đau, hạ sốt",
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC079**: Lấy thông tin thuốc thành công.
- ❌ **TC080**: ID thuốc không tồn tại.
- ❌ **TC081**: Không có quyền truy cập.

#### 5.3 Tạo thuốc mới: POST /api/medicines

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Input**:
```json
{
  "name": "Paracetamol 500mg",
  "unit": "viên",
  "price": 2000,
  "quantity_in_stock": 100,
  "description": "Thuốc giảm đau, hạ sốt"
}
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Thuốc đã được tạo thành công",
  "data": {
    "id": 1,
    "name": "Paracetamol 500mg",
    "unit": "viên",
    "price": 2000,
    "quantity_in_stock": 100,
    "description": "Thuốc giảm đau, hạ sốt",
    "created_at": "2025-05-03T04:34:49.000Z",
    "updated_at": "2025-05-03T04:34:49.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC082**: Tạo thuốc mới thành công.
- ❌ **TC083**: Thiếu thông tin bắt buộc.
- ❌ **TC084**: Tên thuốc đã tồn tại.
- ❌ **TC085**: Giá trị không hợp lệ (giá/số lượng âm).
- ❌ **TC086**: Không có quyền truy cập.

#### 5.4 Cập nhật thông tin thuốc: PUT /api/medicines/:id

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Input**:
```json
{
  "name": "Paracetamol 500mg",
  "unit": "viên",
  "price": 2500,
  "description": "Thuốc giảm đau, hạ sốt. Dùng cho người lớn"
}
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Thông tin thuốc đã được cập nhật",
  "data": {
    "id": 1,
    "name": "Paracetamol 500mg",
    "unit": "viên",
    "price": 2500,
    "quantity_in_stock": 100,
    "description": "Thuốc giảm đau, hạ sốt. Dùng cho người lớn",
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-05-03T04:34:49.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC087**: Cập nhật thông tin thuốc thành công.
- ❌ **TC088**: ID thuốc không tồn tại.
- ❌ **TC089**: Tên thuốc đã tồn tại.
- ❌ **TC090**: Giá trị không hợp lệ (giá âm).
- ❌ **TC091**: Không có quyền truy cập.

#### 5.5 Cập nhật số lượng thuốc: PATCH /api/medicines/:id/update-stock

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Input**:
```json
{
  "quantity": 50,
  "operation": "add"
}
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Số lượng thuốc đã được cập nhật",
  "data": {
    "id": 1,
    "quantity_in_stock": 150,
    "updated_at": "2025-05-03T04:34:49.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC092**: Cập nhật số lượng thuốc thành công khi thêm.
- ✅ **TC093**: Cập nhật số lượng thuốc thành công khi giảm (`operation: "subtract"`).
- ❌ **TC094**: ID thuốc không tồn tại.
- ❌ **TC095**: Số lượng không hợp lệ (âm).
- ❌ **TC096**: Không đủ số lượng để giảm.
- ❌ **TC097**: Không có quyền truy cập.

### 6. Prescription APIs

#### 6.1 Lấy danh sách đơn thuốc: GET /api/prescriptions

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `medicalRecordId`: Lọc theo ID hồ sơ y tế (optional)
- `medicineId`: Lọc theo ID thuốc (optional)
- `staffId`: Lọc theo ID nhân viên (optional)
- `page`: Số trang (optional, default: 1)
- `limit`: Số bản ghi mỗi trang (optional, default: 10)

**Expected Output**:
```json
{
  "success": true,
  "data": {
    "prescriptions": [
      {
        "id": 1,
        "medical_record_id": 1,
        "patient_name": "Nguyễn Văn A",
        "medicine_id": 1,
        "medicine_name": "Paracetamol 500mg",
        "quantity": 10,
        "usage_instruction_id": 1,
        "usage_instruction": "Uống 1 viên sau bữa ăn, ngày 3 lần",
        "staff_id": 2,
        "staff_name": "Bác sĩ B",
        "notes": "Uống sau bữa ăn",
        "created_at": "2025-05-03T00:00:00.000Z",
        "updated_at": "2025-05-03T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 30,
      "page": 1,
      "limit": 10,
      "totalPages": 3
    }
  }
}
```

**Test Cases**:
- ✅ **TC098**: Lấy danh sách đơn thuốc thành công.
- ✅ **TC099**: Lọc đơn thuốc theo hồ sơ y tế.
- ✅ **TC100**: Lọc đơn thuốc theo thuốc.
- ❌ **TC101**: Không có quyền truy cập.

#### 6.2 Lấy thông tin đơn thuốc theo ID: GET /api/prescriptions/:id

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Expected Output**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "medical_record_id": 1,
    "patient_name": "Nguyễn Văn A",
    "medicine_id": 1,
    "medicine_name": "Paracetamol 500mg",
    "quantity": 10,
    "usage_instruction_id": 1,
    "usage_instruction": "Uống 1 viên sau bữa ăn, ngày 3 lần",
    "staff_id": 2,
    "staff_name": "Bác sĩ B",
    "notes": "Uống sau bữa ăn",
    "created_at": "2025-05-03T00:00:00.000Z",
    "updated_at": "2025-05-03T00:00:00.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC102**: Lấy thông tin đơn thuốc thành công.
- ❌ **TC103**: ID đơn thuốc không tồn tại.
- ❌ **TC104**: Không có quyền truy cập.

#### 6.3 Tạo đơn thuốc mới: POST /api/prescriptions

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Input**:
```json
{
  "medical_record_id": 1,
  "medicine_id": 1,
  "quantity": 10,
  "usage_instruction_id": 1,
  "notes": "Uống sau bữa ăn"
}
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Đơn thuốc đã được tạo thành công",
  "data": {
    "id": 1,
    "medical_record_id": 1,
    "medicine_id": 1,
    "quantity": 10,
    "usage_instruction_id": 1,
    "staff_id": 2,
    "notes": "Uống sau bữa ăn",
    "created_at": "2025-05-03T04:34:49.000Z",
    "updated_at": "2025-05-03T04:34:49.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC105**: Tạo đơn thuốc mới thành công.
- ❌ **TC106**: Thiếu thông tin bắt buộc.
- ❌ **TC107**: ID hồ sơ y tế không tồn tại.
- ❌ **TC108**: ID thuốc không tồn tại.
- ❌ **TC109**: ID hướng dẫn sử dụng không tồn tại.
- ❌ **TC110**: Không đủ số lượng thuốc trong kho.
- ❌ **TC111**: Không có quyền truy cập.

#### 6.4 Cập nhật đơn thuốc: PUT /api/prescriptions/:id

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Input**:
```json
{
  "quantity": 15,
  "usage_instruction_id": 2,
  "notes": "Uống trước bữa ăn 30 phút"
}
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Đơn thuốc đã được cập nhật",
  "data": {
    "id": 1,
    "medical_record_id": 1,
    "medicine_id": 1,
    "quantity": 15,
    "usage_instruction_id": 2,
    "staff_id": 2,
    "notes": "Uống trước bữa ăn 30 phút",
    "created_at": "2025-05-03T00:00:00.000Z",
    "updated_at": "2025-05-03T04:34:49.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC112**: Cập nhật đơn thuốc thành công.
- ❌ **TC113**: ID đơn thuốc không tồn tại.
- ❌ **TC114**: ID hướng dẫn sử dụng không tồn tại.
- ❌ **TC115**: Không đủ số lượng thuốc trong kho.
- ❌ **TC116**: Không có quyền truy cập.

### 7. Invoice APIs

#### 7.1 Lấy danh sách hóa đơn: GET /api/invoices

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `medicalRecordId`: Lọc theo ID hồ sơ y tế (optional)
- `patientId`: Lọc theo ID bệnh nhân (optional)
- `staffId`: Lọc theo ID nhân viên (optional)
- `status`: Lọc theo trạng thái (optional)
- `startDate`, `endDate`: Lọc theo khoảng thời gian (optional)
- `page`: Số trang (optional, default: 1)
- `limit`: Số bản ghi mỗi trang (optional, default: 10)

**Expected Output**:
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": 1,
        "medical_record_id": 1,
        "patient_id": 1,
        "patient_name": "Nguyễn Văn A",
        "staff_id": 2,
        "staff_name": "Bác sĩ B",
        "examination_fee": 30000,
        "medicine_fee": 20000,
        "total_amount": 50000,
        "status": "pending",
        "notes": "Hóa đơn khám bệnh thông thường",
        "created_at": "2025-05-03T00:00:00.000Z",
        "updated_at": "2025-05-03T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 80,
      "page": 1,
      "limit": 10,
      "totalPages": 8
    }
  }
}
```

**Test Cases**:
- ✅ **TC117**: Lấy danh sách hóa đơn thành công.
- ✅ **TC118**: Lọc hóa đơn theo hồ sơ y tế.
- ✅ **TC119**: Lọc hóa đơn theo bệnh nhân.
- ✅ **TC120**: Lọc hóa đơn theo trạng thái.
- ❌ **TC121**: Không có quyền truy cập.

#### 7.2 Lấy thông tin hóa đơn theo ID: GET /api/invoices/:id

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Expected Output**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "medical_record_id": 1,
    "patient_id": 1,
    "patient_name": "Nguyễn Văn A",
    "staff_id": 2,
    "staff_name": "Bác sĩ B",
    "examination_fee": 30000,
    "medicine_fee": 20000,
    "total_amount": 50000,
    "status": "pending",
    "notes": "Hóa đơn khám bệnh thông thường",
    "created_at": "2025-05-03T00:00:00.000Z",
    "updated_at": "2025-05-03T00:00:00.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC122**: Lấy thông tin hóa đơn thành công.
- ❌ **TC123**: ID hóa đơn không tồn tại.
- ❌ **TC124**: Không có quyền truy cập.

#### 7.3 Tạo hóa đơn mới: POST /api/invoices

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Input**:
```json
{
  "medical_record_id": 1,
  "notes": "Hóa đơn khám bệnh thông thường"
}
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Hóa đơn đã được tạo thành công",
  "data": {
    "id": 1,
    "medical_record_id": 1,
    "patient_id": 1,
    "staff_id": 2,
    "examination_fee": 30000,
    "medicine_fee": 20000,
    "total_amount": 50000,
    "status": "pending",
    "notes": "Hóa đơn khám bệnh thông thường",
    "created_at": "2025-05-03T04:34:49.000Z",
    "updated_at": "2025-05-03T04:34:49.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC125**: Tạo hóa đơn mới thành công.
- ❌ **TC126**: Thiếu thông tin bắt buộc.
- ❌ **TC127**: ID hồ sơ y tế không tồn tại.
- ❌ **TC128**: Hồ sơ y tế đã có hóa đơn.
- ❌ **TC129**: Không có quyền truy cập.

#### 7.4 Cập nhật hóa đơn: PUT /api/invoices/:id

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Input**:
```json
{
  "status": "pending",
  "notes": "Cập nhật ghi chú hóa đơn"
}
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Hóa đơn đã được cập nhật",
  "data": {
    "id": 1,
    "status": "pending",
    "notes": "Cập nhật ghi chú hóa đơn",
    "updated_at": "2025-05-03T04:34:49.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC130**: Cập nhật hóa đơn thành công.
- ❌ **TC131**: ID hóa đơn không tồn tại.
- ❌ **TC132**: Trạng thái không hợp lệ.
- ❌ **TC133**: Không có quyền truy cập.

#### 7.5 Thanh toán hóa đơn: PATCH /api/invoices/:id/process-payment

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Hóa đơn đã được thanh toán",
  "data": {
    "id": 1,
    "status": "paid",
    "updated_at": "2025-05-03T04:34:49.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC134**: Thanh toán hóa đơn thành công.
- ❌ **TC135**: ID hóa đơn không tồn tại.
- ❌ **TC136**: Hóa đơn đã thanh toán.
- ❌ **TC137**: Hóa đơn đã hủy.
- ❌ **TC138**: Không có quyền truy cập.

#### 7.6 Hủy hóa đơn: PATCH /api/invoices/:id/cancel

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Hóa đơn đã được hủy",
  "data": {
    "id": 1,
    "status": "cancelled",
    "updated_at": "2025-05-03T04:34:49.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC139**: Hủy hóa đơn thành công.
- ❌ **TC140**: ID hóa đơn không tồn tại.
- ❌ **TC141**: Hóa đơn đã thanh toán.
- ❌ **TC142**: Không có quyền truy cập.

### 8. Staff APIs

#### 8.1 Lấy danh sách nhân viên: GET /api/staff

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `search`: Tìm kiếm theo tên, SĐT hoặc email (optional)
- `roleId`: Lọc theo ID vai trò (optional)
- `isActive`: Lọc theo trạng thái hoạt động (optional)
- `page`: Số trang (optional, default: 1)
- `limit`: Số bản ghi mỗi trang (optional, default: 10)

**Expected Output**:
```json
{
  "success": true,
  "data": {
    "staff": [
      {
        "id": 1,
        "username": "admin01",
        "full_name": "Admin User",
        "email": "admin@example.com",
        "phone": "0901234567",
        "address": "123 Đường ABC, Quận 1, TP.HCM",
        "birth_date": "1990-01-01T00:00:00.000Z",
        "gender": "Nam",
        "role_id": 1,
        "role_name": "Admin",
        "is_active": true,
        "created_at": "2025-01-01T00:00:00.000Z",
        "updated_at": "2025-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 20,
      "page": 1,
      "limit": 10,
      "totalPages": 2
    }
  }
}
```

**Test Cases**:
- ✅ **TC143**: Lấy danh sách nhân viên thành công.
- ✅ **TC144**: Tìm kiếm nhân viên theo tên.
- ✅ **TC145**: Lọc nhân viên theo vai trò.
- ✅ **TC146**: Lọc nhân viên theo trạng thái hoạt động.
- ❌ **TC147**: Không có quyền truy cập.

#### 8.2 Lấy thông tin nhân viên theo ID: GET /api/staff/:id

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Expected Output**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin01",
    "full_name": "Admin User",
    "email": "admin@example.com",
    "phone": "0901234567",
    "address": "123 Đường ABC, Quận 1, TP.HCM",
    "birth_date": "1990-01-01T00:00:00.000Z",
    "gender": "Nam",
    "role_id": 1,
    "role_name": "Admin",
    "is_active": true,
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC148**: Lấy thông tin nhân viên thành công.
- ❌ **TC149**: ID nhân viên không tồn tại.
- ❌ **TC150**: Không có quyền truy cập.

#### 8.3 Tạo nhân viên mới: POST /api/staff

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Input**:
```json
{
  "username": "nhanvien01",
  "password": "password123",
  "full_name": "Lê Thị B",
  "email": "lethib@gmail.com",
  "phone": "0901234567",
  "address": "123 Đường Nguyễn Huệ, Quận 1, TP.HCM",
  "birth_date": "1992-05-15",
  "gender": "Nữ",
  "role_id": 2,
  "is_active": true
}
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Nhân viên đã được tạo thành công",
  "data": {
    "id": 2,
    "username": "nhanvien01",
    "full_name": "Lê Thị B",
    "email": "lethib@gmail.com",
    "phone": "0901234567",
    "address": "123 Đường Nguyễn Huệ, Quận 1, TP.HCM",
    "birth_date": "1992-05-15T00:00:00.000Z",
    "gender": "Nữ",
    "role_id": 2,
    "role_name": "Bác sĩ",
    "is_active": true,
    "created_at": "2025-05-03T04:34:49.000Z",
    "updated_at": "2025-05-03T04:34:49.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC151**: Tạo nhân viên mới thành công.
- ❌ **TC152**: Thiếu thông tin bắt buộc.
- ❌ **TC153**: Username đã tồn tại.
- ❌ **TC154**: Email đã tồn tại.
- ❌ **TC155**: ID vai trò không tồn tại.
- ❌ **TC156**: Định dạng dữ liệu không hợp lệ.
- ❌ **TC157**: Không có quyền truy cập.

#### 8.4 Cập nhật thông tin nhân viên: PUT /api/staff/:id

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Input**:
```json
{
  "full_name": "Lê Thị B",
  "email": "lethib@gmail.com",
  "phone": "0901234567",
  "address": "456 Đường Lê Lợi, Quận 1, TP.HCM",
  "gender": "Nữ",
  "role_id": 3,
  "is_active": true
}
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Thông tin nhân viên đã được cập nhật",
  "data": {
    "id": 2,
    "username": "nhanvien01",
    "full_name": "Lê Thị B",
    "email": "lethib@gmail.com",
    "phone": "0901234567",
    "address": "456 Đường Lê Lợi, Quận 1, TP.HCM",
    "birth_date": "1992-05-15T00:00:00.000Z",
    "gender": "Nữ",
    "role_id": 3,
    "role_name": "Y tá",
    "is_active": true,
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-05-03T04:34:49.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC158**: Cập nhật thông tin nhân viên thành công.
- ❌ **TC159**: ID nhân viên không tồn tại.
- ❌ **TC160**: Email đã tồn tại.
- ❌ **TC161**: ID vai trò không tồn tại.
- ❌ **TC162**: Định dạng dữ liệu không hợp lệ.
- ❌ **TC163**: Không có quyền truy cập.

#### 8.5 Đặt lại mật khẩu nhân viên: PATCH /api/staff/:id/reset-password

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Input**:
```json
{
  "new_password": "newpass123"
}
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Mật khẩu đã được đặt lại thành công"
}
```

**Test Cases**:
- ✅ **TC164**: Đặt lại mật khẩu thành công.
- ❌ **TC165**: ID nhân viên không tồn tại.
- ❌ **TC166**: Mật khẩu mới không đáp ứng yêu cầu an toàn.
- ❌ **TC167**: Không có quyền truy cập.

#### 8.6 Vô hiệu hóa tài khoản nhân viên: PATCH /api/staff/:id/deactivate

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Tài khoản nhân viên đã bị vô hiệu hóa",
  "data": {
    "id": 2,
    "is_active": false,
    "updated_at": "2025-05-03T04:34:49.000Z"
  }
}
```

**Test Cases**:
- ✅ **TC168**: Vô hiệu hóa tài khoản thành công.
- ❌ **TC169**: ID nhân viên không tồn tại.
- ❌ **TC170**: Tài khoản đã bị vô hiệu hóa trước đó.
- ❌ **TC171**: Không thể vô hiệu hóa tài khoản admin.
- ❌ **TC172**: Không có quyền truy cập.

## Authentication

Tất cả các API (ngoại trừ /api/auth/login) đều yêu cầu xác thực bằng token JWT.

### Headers cho API có xác thực:

```
Authorization: Bearer <jwt_token>
```

**Test Cases cho xác thực**:
- ❌ **TC173**: Không cung cấp token.
- ❌ **TC174**: Token không hợp lệ.
- ❌ **TC175**: Token đã hết hạn.
- ❌ **TC176**: Người dùng không còn hoạt động (`is_active = false`).

## Kết luận

Tài liệu này cung cấp hướng dẫn chi tiết cho việc kiểm thử API của Hệ thống Quản lý Phòng khám Tư nhân. Tổng cộng có 176 test case được định nghĩa, bao gồm cả các trường hợp thành công và thất bại cho các API endpoint chính.

Các test case đã được thiết kế để kiểm tra toàn diện tính chính xác và độ tin cậy của API, đảm bảo hệ thống hoạt động đúng theo yêu cầu thiết kế và xử lý lỗi một cách phù hợp.

Sau khi hoàn thành kiểm thử, cần lập báo cáo về các lỗi được phát hiện (nếu có) và đảm bảo rằng tất cả các API hoạt động như mong đợi trước khi triển khai hệ thống vào môi trường sản xuất.