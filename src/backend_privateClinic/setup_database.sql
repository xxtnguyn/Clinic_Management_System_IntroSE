-- Xóa các view nếu tồn tại
DROP VIEW IF EXISTS view_appointment_list CASCADE;
DROP VIEW IF EXISTS view_patient_list CASCADE;
DROP VIEW IF EXISTS view_invoice CASCADE;
DROP VIEW IF EXISTS view_daily_revenue CASCADE;
DROP VIEW IF EXISTS view_medicine_usage CASCADE;

-- Xóa các bảng cũ nếu tồn tại
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS usage_instructions CASCADE;
DROP TABLE IF EXISTS medicines CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS disease_types CASCADE;
DROP TABLE IF EXISTS appointment_lists CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- Tạo các function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION check_max_patients_per_day()
RETURNS TRIGGER AS $$
DECLARE
    max_patients  INTEGER;
    current_count INTEGER;
BEGIN
    -- Lấy giới hạn tối đa trong bảng settings
    SELECT value::INTEGER
    INTO   max_patients
    FROM   settings
    WHERE  key = 'max_patients_per_day';

    -- Đếm số bệnh nhân đã đặt lịch trong ngày
    SELECT COUNT(*)
    INTO   current_count
    FROM   appointment_lists
    WHERE  appointment_date = NEW.appointment_date;

    -- Kiểm tra giới hạn
    IF current_count >= max_patients THEN
        RAISE EXCEPTION
            'Số lượng bệnh nhân trong ngày đã đạt tối đa'
            USING ERRCODE = 'P0001',
                  DETAIL  = format(
                               'Ngày: %s, Số lượng hiện tại: %s, Giới hạn: %s',
                               NEW.appointment_date, current_count, max_patients),
                  HINT    = 'Vui lòng chọn ngày khác hoặc liên hệ quản trị viên để tăng giới hạn';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_max_disease_types()
RETURNS TRIGGER AS $$
DECLARE
    max_disease_types INTEGER;
    current_count     INTEGER;
BEGIN
    /* Lấy giới hạn max_disease_types trong bảng settings */
    SELECT value::INTEGER
    INTO   max_disease_types
    FROM   settings
    WHERE  key = 'max_disease_types';

    /* Đếm số loại bệnh hiện có */
    SELECT COUNT(*)
    INTO   current_count
    FROM   disease_types;

    /* Kiểm tra giới hạn */
    IF current_count >= max_disease_types THEN
        RAISE EXCEPTION
            'Đã đạt đến giới hạn số lượng loại bệnh'
            USING ERRCODE = 'P0001',
                  DETAIL  = format(
                               'Số lượng loại bệnh hiện tại: %s, Giới hạn: %s',
                               current_count, max_disease_types),
                  HINT    = 'Vui lòng xóa bớt các loại bệnh không sử dụng hoặc tăng giới hạn trong cài đặt';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_max_medicines()
RETURNS TRIGGER AS $$
DECLARE
    max_medicines INTEGER;
    current_count INTEGER;
BEGIN
    -- Lấy giới hạn max_medicines từ bảng settings
    SELECT value::INTEGER
    INTO   max_medicines
    FROM   settings
    WHERE  key = 'max_medicines';

    -- Đếm số thuốc hiện có
    SELECT COUNT(*)
    INTO   current_count
    FROM   medicines;

    -- Kiểm tra giới hạn
    IF current_count >= max_medicines THEN
        RAISE EXCEPTION
            'Đã đạt đến giới hạn số lượng thuốc'
            USING ERRCODE = 'P0001',
                  DETAIL  = format(
                               'Số lượng thuốc hiện tại: %s, Giới hạn: %s',
                               current_count, max_medicines),
                  HINT    = 'Vui lòng xóa bớt thuốc không sử dụng hoặc tăng giới hạn trong cài đặt';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_max_usage_instructions()
RETURNS TRIGGER AS $$
DECLARE
    max_instructions INTEGER;
    current_count    INTEGER;
BEGIN
    /* Lấy giới hạn tối đa từ bảng settings */
    SELECT value::INTEGER
    INTO   max_instructions
    FROM   settings
    WHERE  key = 'max_usage_instructions';

    /* Đếm số hướng dẫn cách dùng hiện có */
    SELECT COUNT(*)
    INTO   current_count
    FROM   usage_instructions;

    /* Kiểm tra giới hạn */
    IF current_count >= max_instructions THEN
        RAISE EXCEPTION
            'Đã đạt đến giới hạn số lượng cách dùng'
            USING ERRCODE = 'P0001',
                  DETAIL  = format(
                               'Số lượng cách dùng hiện tại: %s, Giới hạn: %s',
                               current_count, max_instructions),
                  HINT    = 'Vui lòng xóa bớt các cách dùng không sử dụng hoặc tăng giới hạn trong cài đặt';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_total_fee()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_fee = NEW.examination_fee + NEW.medicine_fee;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION check_medicine_stock()
RETURNS TRIGGER AS $$
DECLARE
    available_stock INTEGER;
    medicine_name VARCHAR(100);
BEGIN
    SELECT quantity_in_stock, name INTO available_stock, medicine_name 
    FROM medicines WHERE id = NEW.medicine_id;
    
    IF available_stock < NEW.quantity THEN
        RAISE EXCEPTION 'P0001' 
            USING MESSAGE = 'Không đủ số lượng thuốc trong kho',
                  DETAIL = 'Thuốc: ' || medicine_name || ', Số lượng yêu cầu: ' || NEW.quantity || ', Số lượng hiện có: ' || available_stock,
                  HINT = 'Vui lòng kiểm tra lại số lượng thuốc trong kho hoặc nhập thêm thuốc';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_medicine_stock()
RETURNS TRIGGER AS $$
DECLARE
    medicine_name VARCHAR(100);
BEGIN
    SELECT name INTO medicine_name FROM medicines WHERE id = NEW.medicine_id;
    
    UPDATE medicines
    SET quantity_in_stock = quantity_in_stock - NEW.quantity
    WHERE id = NEW.medicine_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_monthly_revenue(month INTEGER, year INTEGER)
RETURNS TABLE (
    "Ngày" DATE,
    "Số Bệnh Nhân" INTEGER,
    "Doanh Thu" DECIMAL(10, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        payment_date::DATE,
        COUNT(*)::INTEGER,
        SUM(total_fee)
    FROM 
        invoices
    WHERE 
        EXTRACT(MONTH FROM payment_date) = month AND
        EXTRACT(YEAR FROM payment_date) = year AND
        status = 'paid'
    GROUP BY 
        payment_date::DATE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_age(birth_year INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM CURRENT_DATE) - birth_year;
END;
$$ LANGUAGE plpgsql;

-- Tạo các bảng không có khóa ngoại trước
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Nam', 'Nữ', 'Khác')),
    birth_year INTEGER CHECK (birth_year > 1900),
    phone VARCHAR(20) UNIQUE,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE disease_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE CHECK (name IN ('admin', 'doctor', 'receptionist')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medicines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    unit VARCHAR(20) NOT NULL CHECK (unit IN ('viên', 'chai')),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    quantity_in_stock INTEGER NOT NULL DEFAULT 0 CHECK (quantity_in_stock >= 0),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usage_instructions (
    id SERIAL PRIMARY KEY,
    instruction TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo lại bảng với các trường mới
CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    gender VARCHAR(10) CHECK (gender IN ('Nam', 'Nữ', 'Khác')),
    avatar VARCHAR(255),
    birth_date DATE,
    role_id INTEGER REFERENCES roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointment_lists (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    appointment_time TIME,
    order_number INTEGER NOT NULL,
    status VARCHAR(20) CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (appointment_date, order_number),
    UNIQUE (patient_id, appointment_date), -- Một bệnh nhân chỉ có thể đặt một lịch hẹn trong một ngày
    UNIQUE (appointment_date, appointment_time) -- Không thể có hai lịch hẹn cùng thởi điểm
);

CREATE TABLE medical_records (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE RESTRICT,
    staff_id INTEGER REFERENCES staff(id) ON DELETE RESTRICT,
    examination_date DATE NOT NULL,
    symptoms TEXT,
    diagnosis TEXT,
    disease_type_id INTEGER REFERENCES disease_types(id) ON DELETE RESTRICT,
    status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prescriptions (
    id SERIAL PRIMARY KEY,
    medical_record_id INTEGER REFERENCES medical_records(id) ON DELETE RESTRICT,
    medicine_id INTEGER REFERENCES medicines(id) ON DELETE RESTRICT,
    staff_id INTEGER REFERENCES staff(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    usage_instruction_id INTEGER REFERENCES usage_instructions(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    medical_record_id INTEGER REFERENCES medical_records(id) ON DELETE RESTRICT,
    staff_id INTEGER REFERENCES staff(id) ON DELETE RESTRICT,
    examination_fee DECIMAL(10, 2) NOT NULL DEFAULT 30000 CHECK (examination_fee >= 0),
    medicine_fee DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (medicine_fee >= 0),
    total_fee DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total_fee >= 0),
    payment_date TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('pending', 'paid', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- Tạo các trigger
CREATE TRIGGER trigger_check_max_patients
BEFORE INSERT OR UPDATE ON appointment_lists
FOR EACH ROW
EXECUTE FUNCTION check_max_patients_per_day();

CREATE TRIGGER update_appointment_lists_updated_at
BEFORE UPDATE ON appointment_lists
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_check_max_disease_types
BEFORE INSERT ON disease_types
FOR EACH ROW
EXECUTE FUNCTION check_max_disease_types();

CREATE TRIGGER update_disease_types_updated_at
BEFORE UPDATE ON disease_types
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_check_max_medicines
BEFORE INSERT ON medicines
FOR EACH ROW
EXECUTE FUNCTION check_max_medicines();

CREATE TRIGGER update_medicines_updated_at
BEFORE UPDATE ON medicines
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_check_max_usage_instructions
BEFORE INSERT ON usage_instructions
FOR EACH ROW
EXECUTE FUNCTION check_max_usage_instructions();

CREATE TRIGGER update_usage_instructions_updated_at
BEFORE UPDATE ON usage_instructions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_calculate_total_fee
BEFORE INSERT OR UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION calculate_total_fee();

CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_check_medicine_stock
BEFORE INSERT ON prescriptions
FOR EACH ROW
EXECUTE FUNCTION check_medicine_stock();

CREATE TRIGGER trigger_update_medicine_stock
AFTER INSERT ON prescriptions
FOR EACH ROW
EXECUTE FUNCTION update_medicine_stock();

CREATE TRIGGER update_prescriptions_updated_at
BEFORE UPDATE ON prescriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON patients
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at
BEFORE UPDATE ON staff
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at
BEFORE UPDATE ON medical_records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at
BEFORE UPDATE ON permissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Tạo các view
CREATE VIEW view_appointment_list AS
SELECT 
    al.appointment_date AS "Ngày khám",
    al.order_number AS "STT",
    p.full_name AS "Họ Tên",
    p.gender AS "Giới Tính",
    p.birth_year AS "Năm Sinh",
    p.address AS "Địa Chỉ"
FROM 
    appointment_lists al
JOIN 
    patients p ON al.patient_id = p.id;

CREATE VIEW view_patient_list AS
SELECT 
    p.full_name AS "Họ Tên",
    mr.examination_date AS "Ngày Khám",
    dt.name AS "Loại Bệnh",
    mr.symptoms AS "Triệu Chứng"
FROM 
    patients p
JOIN 
    medical_records mr ON p.id = mr.patient_id
LEFT JOIN 
    disease_types dt ON mr.disease_type_id = dt.id;

CREATE VIEW view_invoice AS
SELECT 
    p.full_name AS "Họ và tên",
    mr.examination_date AS "Ngày khám",
    inv.examination_fee AS "Tiền khám",
    inv.medicine_fee AS "Tiền thuốc",
    inv.total_fee AS "Tổng tiền",
    inv.status AS "Trạng thái"
FROM 
    invoices inv
JOIN 
    medical_records mr ON inv.medical_record_id = mr.id
JOIN 
    patients p ON mr.patient_id = p.id;

CREATE VIEW view_daily_revenue AS
SELECT 
    payment_date::DATE AS "Ngày",
    COUNT(*) AS "Số Bệnh Nhân",
    SUM(total_fee) AS "Doanh Thu"
FROM 
    invoices
WHERE 
    status = 'paid'
GROUP BY 
    payment_date::DATE;

CREATE VIEW view_medicine_usage AS
SELECT 
    m.name AS "Thuốc",
    m.unit AS "Đơn Vị Tính",
    SUM(p.quantity) AS "Số Lượng",
    COUNT(p.id) AS "Số Lần Dùng"
FROM 
    prescriptions p
JOIN 
    medicines m ON p.medicine_id = m.id
GROUP BY 
    m.name, m.unit;

-- Tạo các index để tối ưu hóa truy vấn
CREATE INDEX idx_patients_full_name ON patients(full_name);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_appointment_lists_date ON appointment_lists(appointment_date);
CREATE INDEX idx_medical_records_date ON medical_records(examination_date);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_prescriptions_medical_record ON prescriptions(medical_record_id);
CREATE INDEX idx_invoices_medical_record ON invoices(medical_record_id);
CREATE INDEX idx_invoices_date ON invoices(payment_date);
CREATE INDEX idx_staff_username ON staff(username);
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_staff_role ON staff(role_id);
CREATE INDEX idx_medical_records_examination_date ON medical_records(examination_date);
CREATE INDEX idx_prescriptions_medicine_id ON prescriptions(medicine_id);
CREATE INDEX idx_invoices_payment_date ON invoices(payment_date);

-- Thêm constraints bổ sung
ALTER TABLE usage_instructions ADD CONSTRAINT unique_instruction UNIQUE (instruction);
ALTER TABLE medicines ADD CONSTRAINT check_unit CHECK (unit IN ('viên', 'chai'));

-- Chèn dữ liệu vào bảng settings (đã có trong cấu trúc, giữ nguyên)
INSERT INTO settings (key, value, description) VALUES
    ('max_patients_per_day', '40', 'Số bệnh nhân tối đa mỗi ngày'),
    ('max_disease_types', '5', 'Số loại bệnh tối đa'),
    ('max_medicines', '30', 'Số loại thuốc tối đa'),
    ('max_usage_instructions', '4', 'Số cách dùng tối đa'),
    ('examination_fee', '30000', 'Phí khám mặc định');

INSERT INTO patients (full_name, gender, birth_year, phone, address) VALUES
('Nguyễn Văn An', 'Nam', 1990, '0912345678', '12 Nguyễn Huệ, Quận 1, TP.HCM'),
('Trần Thị Bình', 'Nữ', 1985, '0987654321', '45 Lê Lợi, Quận 1, TP.HCM'),
('Lê Văn Cường', 'Nam', 1992, '0931122334', '78 Hai Bà Trưng, Quận 3, TP.HCM'),
('Phạm Thị Duyên', 'Nữ', 1998, '0944112233', '23 Nguyễn Trãi, Quận 5, TP.HCM'),
('Hoàng Văn Em', 'Nam', 1983, '0909988776', '56 Cách Mạng Tháng 8, Quận 10, TP.HCM'),
('Vũ Thị Phương', 'Nữ', 1994, '0966554433', '89 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM'),
('Đặng Văn Giang', 'Nam', 1987, '0977889900', '34 Võ Thị Sáu, Quận 3, TP.HCM'),
('Bùi Thị Hà', 'Nữ', 1996, '0922334455', '67 Trường Chinh, Quận Tân Bình, TP.HCM'),
('Ngô Văn Hùng', 'Nam', 1981, '0933445566', '23 Lý Thường Kiệt, Quận Tân Phú, TP.HCM'),
('Mai Thị In', 'Nữ', 1995, '0911998877', '45 Nguyễn Văn Cừ, Quận 5, TP.HCM'),
('Phạm Văn Khoa', 'Nam', 1993, '0977112233', '123 Nguyễn Kiệm, Quận Phú Nhuận, TP.HCM'),
('Trần Thị Liên', 'Nữ', 1989, '0903111222', '90 Hoàng Văn Thụ, Quận Tân Bình, TP.HCM'),
('Lê Thị Thanh', 'Nữ', 2000, '0955667788', '15 Bạch Đằng, Quận Bình Thạnh, TP.HCM'),
('Nguyễn Văn Dũng', 'Nam', 1984, '0938776655', '36 Pasteur, Quận 1, TP.HCM'),
('Đỗ Thị Hằng', 'Nữ', 1991, '0966778899', '81 Phan Xích Long, Quận Phú Nhuận, TP.HCM'),
('Trịnh Văn Sơn', 'Nam', 1986, '0944221133', '62 Nguyễn Oanh, Quận Gò Vấp, TP.HCM'),
('Đoàn Thị Hoa', 'Nữ', 1997, '0988112233', '11 Dương Bá Trạc, Quận 8, TP.HCM'),
('Nguyễn Hữu Tài', 'Nam', 1990, '0911888776', '19 Tô Hiến Thành, Quận 10, TP.HCM'),
('Võ Thị Mai', 'Nữ', 1982, '0922557799', '75 Huỳnh Tấn Phát, Quận 7, TP.HCM'),
('Trần Minh Quân', 'Nam', 1999, '0908776655', '22 Trần Hưng Đạo, Quận 1, TP.HCM');



-- Chèn dữ liệu vào bảng disease_types (5 loại bệnh - đúng giới hạn tối đa)
INSERT INTO disease_types (name, description) VALUES
    ('Cảm cúm', 'Bệnh do virus gây ra, triệu chứng sốt, ho, sổ mũi'),
    ('Viêm họng', 'Viêm nhiễm ở họng, đau rát, khó nuốt'),
    ('Tiêu chảy', 'Rối loạn tiêu hóa, đi ngoài nhiều lần'),
    ('Đau đầu', 'Đau nhức đầu do căng thẳng hoặc bệnh lý'),
    ('Viêm da', 'Viêm nhiễm da, ngứa, đỏ da');

-- Chèn dữ liệu vào bảng roles (3 vai trò)
INSERT INTO roles (name, description) VALUES
    ('admin', 'Quản trị viên hệ thống'),
    ('doctor', 'Bác sĩ khám và kê đơn'),
    ('receptionist', 'Nhân viên tiếp nhận và lập hóa đơn');

-- Chèn dữ liệu vào bảng medicines (30 loại thuốc - đúng giới hạn tối đa)
INSERT INTO medicines (name, unit, price, quantity_in_stock, description) VALUES
    ('Paracetamol', 'viên', 500, 1000, 'Giảm đau, hạ sốt'),
    ('Amoxicillin', 'viên', 1000, 500, 'Kháng sinh điều trị nhiễm khuẩn'),
    ('Cefalexin', 'viên', 1500, 600, 'Kháng sinh nhóm cephalosporin'),
    ('Ibuprofen', 'viên', 800, 700, 'Giảm đau, chống viêm'),
    ('Loratadine', 'viên', 600, 800, 'Kháng histamine, trị dị ứng'),
    ('Omeprazole', 'viên', 1200, 400, 'Giảm acid dạ dày'),
    ('Metronidazole', 'viên', 900, 500, 'Kháng sinh trị ký sinh trùng'),
    ('Aspirin', 'viên', 700, 600, 'Giảm đau, chống đông máu'),
    ('Berberine', 'viên', 400, 1000, 'Trị tiêu chảy'),
    ('Dexamethasone', 'viên', 2000, 300, 'Chống viêm, dị ứng'),
    ('Prednisolone', 'viên', 1800, 400, 'Corticoid chống viêm'),
    ('Clarithromycin', 'viên', 2500, 200, 'Kháng sinh macrolid'),
    ('Azithromycin', 'viên', 3000, 150, 'Kháng sinh trị nhiễm khuẩn'),
    ('Domperidone', 'viên', 800, 500, 'Chống nôn, kích thích tiêu hóa'),
    ('Loperamide', 'viên', 600, 600, 'Trị tiêu chảy cấp'),
    ('Salbutamol', 'chai', 15000, 100, 'Giãn phế quản, trị hen suyễn'),
    ('Chloramphenicol', 'chai', 12000, 120, 'Kháng sinh nhỏ mắt'),
    ('Natri clorid 0.9%', 'chai', 5000, 200, 'Dung dịch rửa vết thương'),
    ('Betadine', 'chai', 20000, 80, 'Sát khuẩn ngoài da'),
    ('Hydrogen Peroxide', 'chai', 8000, 150, 'Sát trùng vết thương'),
    ('Ciprofloxacin', 'viên', 2000, 300, 'Kháng sinh quinolone'),
    ('Fluconazole', 'viên', 2500, 200, 'Kháng nấm'),
    ('Acyclovir', 'viên', 2200, 250, 'Kháng virus herpes'),
    ('Montelukast', 'viên', 1800, 300, 'Trị dị ứng, hen suyễn'),
    ('Levofloxacin', 'viên', 2800, 200, 'Kháng sinh fluoroquinolone'),
    ('Doxycycline', 'viên', 1500, 400, 'Kháng sinh tetracycline'),
    ('Nystatin', 'chai', 10000, 100, 'Kháng nấm ngoài da'),
    ('Mupirocin', 'chai', 25000, 80, 'Kháng sinh bôi ngoài da'),
    ('Hydrocortisone', 'chai', 18000, 90, 'Corticoid bôi ngoài'),
    ('Ketoconazole', 'chai', 20000, 100, 'Kháng nấm bôi ngoài');

-- Chèn dữ liệu vào bảng usage_instructions (4 cách dùng - đúng giới hạn tối đa)
INSERT INTO usage_instructions (instruction, description) VALUES
    ('Uống 1 viên/ngày sau ăn', 'Dùng sau bữa ăn để giảm kích ứng dạ dày'),
    ('Uống 2 viên/ngày trước ăn', 'Dùng trước bữa ăn để tăng hấp thu'),
    ('Bôi ngoài da 2 lần/ngày', 'Bôi lên vùng da bị ảnh hưởng'),
    ('Nhỏ 2 giọt/lần, 3 lần/ngày', 'Dùng cho mắt hoặc tai');

-- Chèn quyền chi tiết theo từng chức năng
INSERT INTO permissions (name, description) VALUES
    -- Quyền về bệnh nhân
    ('view_patients', 'Xem thông tin bệnh nhân'),
    ('create_patient', 'Tạo mới bệnh nhân'),
    ('update_patient', 'Cập nhật thông tin bệnh nhân'),
    ('delete_patient', 'Xóa bệnh nhân'),
    ('search_patients', 'Tìm kiếm bệnh nhân'),
    
    -- Quyền về thuốc
    ('view_medicines', 'Xem thông tin thuốc'),
    ('create_medicine', 'Thêm thuốc mới'),
    ('update_medicine', 'Cập nhật thông tin thuốc'),
    ('delete_medicine', 'Xóa thuốc'),
    ('manage_medicine_stock', 'Quản lý tồn kho thuốc'),
    
    -- Quyền về lịch hẹn
    ('view_appointments', 'Xem danh sách lịch hẹn'),
    ('create_appointment', 'Đặt lịch hẹn mới'),
    ('update_appointment', 'Cập nhật lịch hẹn'),
    ('cancel_appointment', 'Hủy lịch hẹn'),
    
    -- Quyền về bệnh án/hồ sơ y tế
    ('view_medical_records', 'Xem hồ sơ y tế'),
    ('create_medical_record', 'Tạo hồ sơ y tế mới'),
    ('update_medical_record', 'Cập nhật hồ sơ y tế'),
    ('delete_medical_record', 'Xóa hồ sơ y tế'),
    
    -- Quyền về đơn thuốc
    ('view_prescriptions', 'Xem đơn thuốc'),
    ('create_prescription', 'Tạo đơn thuốc mới'),
    ('update_prescription', 'Cập nhật đơn thuốc'),
    ('delete_prescription', 'Xóa đơn thuốc'),
    
    -- Quyền về hóa đơn
    ('view_invoices', 'Xem hóa đơn'),
    ('create_invoice', 'Tạo hóa đơn mới'),
    ('update_invoice', 'Cập nhật hóa đơn'),
    ('delete_invoice', 'Xóa hóa đơn'),
    ('process_payment', 'Xử lý thanh toán'),
    
    -- Quyền về loại bệnh
    ('view_disease_types', 'Xem thông tin loại bệnh'),
    ('create_disease_type', 'Thêm loại bệnh mới'),
    ('update_disease_type', 'Cập nhật thông tin loại bệnh'),
    ('delete_disease_type', 'Xóa loại bệnh'),
    
    -- Quyền về cách dùng thuốc
    ('view_usage_instructions', 'Xem hướng dẫn sử dụng thuốc'),
    ('create_usage_instruction', 'Thêm hướng dẫn sử dụng thuốc mới'),
    ('update_usage_instruction', 'Cập nhật hướng dẫn sử dụng thuốc'),
    ('delete_usage_instruction', 'Xóa hướng dẫn sử dụng thuốc'),
    
    -- Quyền về nhân viên và quản trị hệ thống
    ('view_staff', 'Xem thông tin nhân viên'),
    ('create_staff', 'Thêm nhân viên mới'),
    ('update_staff', 'Cập nhật thông tin nhân viên'),
    ('delete_staff', 'Vô hiệu hóa/xóa nhân viên'),
    ('view_roles', 'Xem danh sách vai trò'),
    ('manage_roles', 'Quản lý vai trò và phân quyền'),
    
    -- Quyền về báo cáo và cài đặt
    ('view_reports', 'Xem báo cáo thống kê'),
    ('generate_reports', 'Tạo báo cáo thống kê'),
    ('view_settings', 'Xem cài đặt hệ thống'),
    ('create_setting', 'Tạo mới cài đặt hệ thống'),
    ('update_setting', 'Cập nhật cài đặt hệ thống'),
    ('delete_setting', 'Xóa cài đặt hệ thống');

-- Chèn dữ liệu vào bảng staff (3 nhân viên mẫu: 1 admin, 1 bác sĩ, 1 tiếp tân)
-- Chèn dữ liệu vào bảng staff (3 nhân viên mẫu: 1 admin, 1 bác sĩ, 1 tiếp tân)
-- Sử dụng mật khẩu đã được hash (mật khẩu gốc: 123456)
INSERT INTO staff (
    username, 
    password, 
    full_name, 
    email, 
    phone, 
    address, 
    gender, 
    avatar, 
    birth_date, 
    role_id, 
    is_active
) VALUES
    ('admin01', 
     '$2b$10$lQv9aMM3Lm/9/8ZMXqLmWeYgDQcFxQf/GPiyNNmddQOHmyITunIK6', 
     'Nguyễn Admin', 
     'admin@clinic.com', 
     '0901112233', 
     '123 Đường Láng, Hà Nội', 
     'Nam', 
     '/uploads/avatars/admin-avatar.png', 
     '1985-05-15', 
     1, 
     true),
     
    ('doctor01', 
     '$2b$10$lQv9aMM3Lm/9/8ZMXqLmWeYgDQcFxQf/GPiyNNmddQOHmyITunIK6', 
     'Trần Bác Sĩ', 
     'doctor@clinic.com', 
     '0902223344', 
     '45 Nguyễn Huệ, TP.HCM', 
     'Nam', 
     '/uploads/avatars/doctor-avatar.png', 
     '1990-08-22', 
     2, 
     true),
     
    ('receptionist01', 
     '$2b$10$lQv9aMM3Lm/9/8ZMXqLmWeYgDQcFxQf/GPiyNNmddQOHmyITunIK6', 
     'Lê Thị Tiếp Tân', 
     'receptionist@clinic.com', 
     '0903334455', 
     '78 Lê Lợi, Đà Nẵng', 
     'Nữ', 
     '/uploads/avatars/receptionist-avatar.png', 
     '1995-11-30', 
     3, 
     true);

-- Phân quyền cho vai trò admin - có tất cả quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Phân quyền cho vai trò bác sĩ (doctor)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE name IN (
    -- Quyền về bệnh nhân
    'view_patients', 'search_patients',
    
    -- Quyền về thuốc
    'view_medicines',
    
    -- Quyền về lịch hẹn
    'view_appointments', 'update_appointment',
    
    -- Quyền về bệnh án/hồ sơ y tế
    'view_medical_records', 'create_medical_record', 'update_medical_record',
    
    -- Quyền về đơn thuốc
    'view_prescriptions', 'create_prescription', 'update_prescription', 'delete_prescription',
    
    -- Quyền về hóa đơn
    'view_invoices',
    
    -- Quyền về loại bệnh
    'view_disease_types',
    
    -- Quyền về cách dùng thuốc
    'view_usage_instructions',
    
    -- Quyền về báo cáo
    'view_reports'
);

-- Phân quyền cho vai trò lễ tân (receptionist)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE name IN (
    -- Quyền về bệnh nhân
    'view_patients', 'create_patient', 'update_patient', 'search_patients',
    
    -- Quyền về thuốc
    'view_medicines',
    
    -- Quyền về lịch hẹn
    'view_appointments', 'create_appointment', 'update_appointment', 'cancel_appointment',
    
    -- Quyền về bệnh án/hồ sơ y tế
    'view_medical_records',
    
    -- Quyền về đơn thuốc
    'view_prescriptions',
    
    -- Quyền về hóa đơn
    'view_invoices', 'create_invoice', 'update_invoice', 'process_payment',
    
    -- Quyền về loại bệnh
    'view_disease_types',
    
    -- Quyền về báo cáo
    'view_reports',
    -- Quyền về cài đặt
    'view_settings'
);

-- Ngày 07/07/2025 - hoàn thành
INSERT INTO appointment_lists (patient_id, appointment_date, appointment_time, order_number, status, notes) VALUES
(1, '2025-07-07', '08:00:00', 1, 'completed', 'Khám cảm cúm'),
(2, '2025-07-07', '08:15:00', 2, 'completed', 'Khám viêm họng'),
(3, '2025-07-07', '08:30:00', 3, 'completed', 'Khám tiêu chảy'),
(4, '2025-07-07', '08:45:00', 4, 'completed', 'Khám đau đầu'),
(5, '2025-07-07', '09:00:00', 5, 'completed', 'Khám viêm da');

-- Ngày 08/07/2025 - hoàn thành
INSERT INTO appointment_lists (patient_id, appointment_date, appointment_time, order_number, status, notes) VALUES
(6, '2025-07-08', '08:00:00', 1, 'completed', 'Khám cảm cúm'),
(7, '2025-07-08', '08:15:00', 2, 'completed', 'Khám viêm họng'),
(8, '2025-07-08', '08:30:00', 3, 'completed', 'Khám tiêu chảy'),
(9, '2025-07-08', '08:45:00', 4, 'completed', 'Khám đau đầu'),
(10, '2025-07-08', '09:00:00', 5, 'completed', 'Khám viêm da'),
(11, '2025-07-08', '09:15:00', 6, 'completed', 'Khám dị ứng'),
(12, '2025-07-08', '09:30:00', 7, 'completed', 'Khám viêm mũi');

-- Ngày 09/07/2025 - đang chờ, tổng cộng 38 lịch hẹn
INSERT INTO appointment_lists (patient_id, appointment_date, appointment_time, order_number, status, notes) VALUES
(13, '2025-07-09', '08:00:00', 1, 'waiting', 'Khám cảm cúm'),
(14, '2025-07-09', '08:15:00', 2, 'waiting', 'Khám viêm họng'),
(15, '2025-07-09', '08:30:00', 3, 'waiting', 'Khám tiêu chảy'),
(16, '2025-07-09', '08:45:00', 4, 'waiting', 'Khám đau đầu'),
(17, '2025-07-09', '09:00:00', 5, 'waiting', 'Khám viêm da'),
(18, '2025-07-09', '09:15:00', 6, 'waiting', 'Khám cảm lạnh'),
(1, '2025-07-09', '09:30:00', 7, 'waiting', 'Khám dị ứng'),
(2, '2025-07-09', '09:45:00', 8, 'waiting', 'Khám tiêu hóa'),
(3, '2025-07-09', '10:00:00', 9, 'waiting', 'Khám đau lưng'),
(4, '2025-07-09', '10:15:00', 10, 'waiting', 'Khám huyết áp'),
(5, '2025-07-09', '10:30:00', 11, 'waiting', 'Khám cảm cúm'),
(6, '2025-07-09', '10:45:00', 12, 'waiting', 'Khám viêm mũi dị ứng'),
(7, '2025-07-09', '11:00:00', 13, 'waiting', 'Khám tai mũi họng'),
(8, '2025-07-09', '11:15:00', 14, 'waiting', 'Khám ho kéo dài'),
(9, '2025-07-09', '11:30:00', 15, 'waiting', 'Khám tiêu chảy'),
(10, '2025-07-09', '11:45:00', 16, 'waiting', 'Khám viêm họng hạt'),
(11, '2025-07-09', '12:00:00', 17, 'waiting', 'Khám đau đầu mãn tính'),
(12, '2025-07-09', '12:15:00', 18, 'waiting', 'Khám da liễu');


-- Ngày 07/07/2025
INSERT INTO medical_records (patient_id, staff_id, examination_date, symptoms, diagnosis, disease_type_id, status, notes) VALUES
(1, 2, '2025-07-07', 'Sốt nhẹ, ho', 'Cảm cúm', 1, 'completed', 'Nghỉ ngơi, uống thuốc'),
(2, 2, '2025-07-07', 'Đau họng', 'Viêm họng', 2, 'completed', 'Tránh uống lạnh'),
(3, 2, '2025-07-07', 'Đau bụng, đi ngoài', 'Tiêu chảy', 3, 'completed', 'Bù nước, men tiêu hóa'),
(4, 2, '2025-07-07', 'Đau đầu căng thẳng', 'Đau đầu', 4, 'completed', 'Nghỉ ngơi, giảm stress'),
(5, 2, '2025-07-07', 'Da đỏ, ngứa', 'Viêm da', 5, 'completed', 'Tránh tiếp xúc dị ứng');

-- Ngày 08/07/2025
INSERT INTO medical_records (patient_id, staff_id, examination_date, symptoms, diagnosis, disease_type_id, status, notes) VALUES
(6, 2, '2025-07-08', 'Ho có đờm', 'Cảm cúm', 1, 'completed', 'Thuốc ho, vitamin'),
(7, 2, '2025-07-08', 'Đau rát họng', 'Viêm họng', 2, 'completed', 'Nước ấm, thuốc ngậm'),
(8, 2, '2025-07-08', 'Đi ngoài nhiều lần', 'Tiêu chảy', 3, 'completed', 'Tránh đồ sống'),
(9, 2, '2025-07-08', 'Đau đầu nhẹ', 'Đau đầu', 4, 'completed', 'Giảm đau'),
(10, 2, '2025-07-08', 'Mẩn ngứa tay chân', 'Viêm da', 5, 'completed', 'Bôi thuốc dị ứng'),
(11, 2, '2025-07-08', 'Ho, đau họng', 'Viêm họng', 2, 'completed', 'Thuốc uống'),
(12, 2, '2025-07-08', 'Khó tiêu, đầy bụng', 'Tiêu chảy nhẹ', 3, 'completed', 'Men tiêu hóa');


-- Giả định staff_id = 2, usage_instruction_id = 1 (uống), 3 (bôi)
INSERT INTO prescriptions (medical_record_id, medicine_id, staff_id, quantity, usage_instruction_id, notes) VALUES
-- Ngày 07/07
(6, 1, 2, 10, 1, 'Uống khi sốt'),
(6, 5, 2, 5, 1, 'Trị dị ứng'),
(7, 2, 2, 14, 1, 'Kháng sinh'),
(7, 4, 2, 6, 1, 'Giảm đau'),
(8, 9, 2, 10, 1, 'Trị tiêu chảy'),
(8, 18, 2, 1, 1, 'Bù nước'),
(9, 1, 2, 8, 1, 'Giảm đau đầu'),
(9, 8, 2, 5, 1, 'Hỗ trợ giảm đau'),
(10, 10, 2, 4, 3, 'Bôi vùng da viêm'),
(10, 19, 2, 1, 3, 'Sát khuẩn da'),

-- Ngày 08/07
(11, 1, 2, 10, 1, 'Hạ sốt'),
(11, 5, 2, 5, 1, 'Kháng dị ứng');

-- Giả sử staff_id thu ngân là 3
INSERT INTO invoices (medical_record_id, staff_id, examination_fee, medicine_fee, total_fee, payment_date, status, notes) VALUES
-- Ngày 07/07
(6, 3, 30000, 5500, 35500, '2025-07-07 08:00:00', 'paid', 'Tiền mặt'),
(7, 3, 30000, 13400, 43400, '2025-07-07 08:30:00', 'paid', 'Chuyển khoản'),
(8, 3, 30000, 9000, 39000, '2025-07-07 09:00:00', 'paid', 'Tiền mặt'),
(9, 3, 30000, 5700, 35700, '2025-07-07 09:30:00', 'paid', 'Tiền mặt'),
(10, 3, 30000, 28000, 58000, '2025-07-07 10:00:00', 'paid', 'Chuyển khoản'),

-- Ngày 08/07
(11, 3, 30000, 6000, 36000, '2025-07-08 08:00:00', 'paid', 'Tiền mặt');




-- Tạo bảng lưu trữ token đặt lại mật khẩu
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used BOOLEAN DEFAULT FALSE
);

-- Tạo index cho token để tìm kiếm nhanh hơn
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);

-- Tạo index cho user_id để tìm kiếm nhanh hơn
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id);