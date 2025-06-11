import { useEffect, useState } from "react";
import HeaderDashboard from "../components/HeaderDashboard";
import { useLocation } from "react-router-dom";
import { Search } from "lucide-react";
import Table from "../components/Table";
import { invoiceService } from "../api/invoice.service";
import { medicalRecordService } from "../api/medical_record.service";
import { settingService } from "../api/setting.service";

interface Invoice_ {
  id: number;
  patient_name: string;
  examination_date: string;
  examination_fee: string;
  medicine_fee: string;
  status: string;
  notes: string;
  total_fee: string;
  patient_id: number;
  payment_date: string;
}

interface Prescription {
  medicine_name: string;
  medicine_unit: string;
  medicine_price: string;
  quantity: string;
}

interface MedicalRecord {
  examination_date: string;
  id: number;
  patient_id: number;
  patient_name: string;
  patient_name_id: string;
}

const defaultMedicalRecord: MedicalRecord = {
  examination_date: "yyyy-MM-dd",
  id: 0,
  patient_id: 0,
  patient_name: "",
  patient_name_id: "",
};

const defaultInvoice: Invoice_ = {
  id: 0,
  patient_name: "",
  examination_date: "yyyy-MM-dd",
  examination_fee: "",
  medicine_fee: "",
  status: "",
  notes: "",
  total_fee: "",
  patient_id: 0,
  payment_date: "yyyy-MM-dd",
};

const Invoice = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [basedOn, setBasedOn] = useState<keyof Invoice_ | "">("");
  const [invoices, setInvoices] = useState<Invoice_[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice_[]>([]);
  const [presentList, setPresentList] = useState<Invoice_[]>([]);
  const [choosedInvoice, setChoosedInvoice] =
    useState<Invoice_>(defaultInvoice);
  const [isAddingInvoice, setIsAddingInvoice] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [examinationFee, setExaminationFee] = useState(0);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [choosedMedicalRecord, setChoosedMedicalRecord] =
    useState<MedicalRecord>(defaultMedicalRecord);
  const [update, setUpdate] = useState(0);

  const handleSearch = () => {
    var filteredInvoices_ = invoices;
    if (basedOn != "") {
      filteredInvoices_ = invoices.filter((item) =>
        String(item[basedOn])
          .toLowerCase()
          .includes(String(searchTerm).toLowerCase())
      );
    } else {
      console.log("Please choose Based on");
    }
    setPresentList(filteredInvoices_);
  };

  useEffect(() => {
    const fetchInvoices = async () => {
      const invoices = await invoiceService.getInvoices();

      for (let i = 0; i < invoices.length; i++) {
        invoices[i].examination_date = invoices[i].examination_date.slice(
          0,
          10
        );
        if (invoices[i].payment_date) {
          invoices[i].payment_date = invoices[i].payment_date.slice(0, 10);
        } else {
          invoices[i].payment_date = "yyyy-MM-dd";
        }
      }
      setInvoices(invoices);
    };

    fetchInvoices();
  }, [update]);

  useEffect(() => {
    const fetchExaminationFee = async () => {
      const examinationFee = await settingService.getValueByKey(
        "examination_fee"
      );
      setExaminationFee(examinationFee);
    };

    fetchExaminationFee();
  }, []);

  useEffect(() => {
    setFilteredInvoices(invoices);
  }, [invoices]);

  useEffect(() => {
    setPresentList(filteredInvoices);
  }, [filteredInvoices]);

  useEffect(() => {
    if (choosedInvoice && choosedInvoice.id != 0) {
      setIsAddingInvoice(false);
    }
  }, [choosedInvoice]);

  useEffect(() => {
    if (isAddingInvoice) {
      setChoosedInvoice({
        ...defaultInvoice,
        examination_fee: String(examinationFee),
      });
    }
  }, [isAddingInvoice]);

  useEffect(() => {
    if (isAddingInvoice) {
      setChoosedMedicalRecord({
        ...defaultMedicalRecord,
      });
    }
  }, [isAddingInvoice]);

  useEffect(() => {
    if (choosedInvoice.patient_id != 0) {
      const fetchPrescriptions = async () => {
        const prescriptions = await medicalRecordService.getPrescriptionsByID(
          choosedInvoice.patient_id
        );
        setPrescriptions(prescriptions);
      };

      fetchPrescriptions();
    } else {
      setPrescriptions([]);
    }
  }, [choosedInvoice]);

  useEffect(() => {
    if (isAddingInvoice) {
      const fetchMedicalRecords = async () => {
        const medicalRecords =
          await medicalRecordService.getMedicalRecordByDate(
            "1990-01-01",
            "2100-01-01"
          );
        for (let i = 0; i < medicalRecords.length; i++) {
          medicalRecords[i].patient_name_id =
            medicalRecords[i].patient_name +
            " - ID: " +
            medicalRecords[i].patient_id;
        }

        setMedicalRecords(medicalRecords as MedicalRecord[]);
      };

      fetchMedicalRecords();
    }
  }, [isAddingInvoice]);

  useEffect(() => {
    if (choosedMedicalRecord.id != 0) {
      setChoosedInvoice({
        ...defaultInvoice,
        patient_name: choosedMedicalRecord.patient_name,
        patient_id: choosedMedicalRecord.patient_id,
        examination_date: choosedMedicalRecord.examination_date.slice(0, 10),
        examination_fee: String(examinationFee),
      });
    }
  }, [choosedMedicalRecord]);

  useEffect(() => {
    if (isAddingInvoice || (choosedInvoice && choosedInvoice.id))
      window.scrollTo({
        top: document.documentElement.scrollHeight, // Cuộn đến cuối trang
        behavior: "smooth", // Cuộn mượt mà
      });
  }, [isAddingInvoice, choosedInvoice]);

  const location = useLocation();
  const { user } = location.state || {};

  const handleCreate = async () => {
    try {
      await invoiceService.createInvoice(
        choosedMedicalRecord.id,
        choosedInvoice.notes
      );
      alert("Hóa đơn tạo thành công");
      setUpdate(update + 1);
    } catch (error) {
      const err = error as Error;
      alert("Tạo không thành công: " + err.message);
    }
  };
  const handleUpdate = async () => {
    try {
      await invoiceService.updateInvoice(choosedInvoice.id, {
        notes: choosedInvoice.notes,
        payment_date: choosedInvoice.payment_date + "T19:30:00+07:00",
      });
      alert("Hóa đơn cập nhật thành công");
      setUpdate(update + 1);
    } catch (error) {
      const err = error as Error;
      alert("Cập nhật không thành công: " + err.message);
    }
  };

  const handleCancel = async () => {
    try {
      await invoiceService.updateInvoice(choosedInvoice.id, {
        status: "cancelled",
      });
      alert("Hóa đơn hủy thành công");
      setUpdate(update + 1);
    } catch (error) {
      const err = error as Error;
      alert("Hủy không thành công: " + err.message);
    }
  };

  const handlePayment = async () => {
    try {
      await invoiceService.updateInvoice(choosedInvoice.id, {
        status: "paid",
      });
      alert("Thanh toán thành công");
      setUpdate(update + 1);
    } catch (error) {
      const err = error as Error;
      alert("Thanh toán không thành công: " + err.message);
    }
  };

  const handleChoose = (id: number) => {
    for (let i = 0; i < presentList.length; i++) {
      if (presentList[i].id == id) {
        setChoosedInvoice(presentList[i]);
      }
    }
  };

  return (
    <div className="min-h-screen w-full">
      <HeaderDashboard currentUser={user} />
      <main className="container mx-auto px-8 py-6 mt-16">
        <div className="max-w-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="max-w-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden pb-">
            {/* Month Selector and Search */}
            <div className="mb-6 space-y-4">
              {/* Search Section */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                </div>

                <span className="text-blue-600 font-light italic">
                  Based on
                </span>
                <select
                  value={basedOn}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
                  onChange={(e) => setBasedOn(e.target.value as keyof Invoice_)}
                >
                  <option value="">-- Choose --</option>
                  <option value="id">Invoice ID</option>
                  <option value="patient_name">Full Name</option>
                  <option value="examination_date">Visit Date</option>
                </select>

                <button
                  className="px-6 py-2 text-blue-500 bg-white border border-blue-500 rounded-md hover:bg-blue-600 hover:text-white transition-colors font-medium"
                  onClick={handleSearch}
                >
                  Find
                </button>
              </div>
            </div>
            <p className="text-blue-600 font-semibold text-lg mt-4 mb-2">
              Select the invoice requiring an update
            </p>
            <Table
              headers={[
                "Invoice ID",
                "Full Name",
                "Visit Date",
                "Consultant Fee",
                "Total Medicine Fee",
                "Status",
              ]}
              handleChoose={handleChoose}
              filteredItems={presentList as Invoice_[]}
              attributesOfItem={[
                "id",
                "patient_name",
                "examination_date",
                "examination_fee",
                "medicine_fee",
                "status",
              ]}
            />

            <div className="p-6">
              <button
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
                onClick={() => {
                  setIsAddingInvoice(!isAddingInvoice);
                }}
              >
                Add a new invoice
              </button>
            </div>
          </div>
          {(choosedInvoice.id != 0 || isAddingInvoice) && (
            <>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                {/* Header */}
                <div className="bg-blue-500 text-white text-center py-3">
                  <h2 className="text-xl font-semibold">INVOICE</h2>
                </div>

                {/* Left Section - Patient Info and Right Section - Medicine Table */}
                <div className="flex">
                  {/* Left Section - Patient Information */}
                  <div className="w-1/2 border-r border-gray-300">
                    {isAddingInvoice && (
                      <div className="border-b border-gray-300">
                        <div className="flex">
                          <div className="w-2/5 bg-gray-50 p-3 border-r border-gray-300 font-medium text-sm">
                            Choose Medical Record:
                          </div>
                          <div className="flex-1 p-3">
                            <select
                              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              value={choosedMedicalRecord.id}
                              onChange={(e) => {
                                for (
                                  let i = 0;
                                  i < medicalRecords.length;
                                  i++
                                ) {
                                  if (
                                    Number(e.target.value) ==
                                    medicalRecords[i].id
                                  ) {
                                    setChoosedMedicalRecord(medicalRecords[i]);
                                  }
                                }
                              }}
                            >
                              <option value={0}>
                                --Choose a medical record
                              </option>
                              {medicalRecords.map((medicalRecord, index) => (
                                <option key={index} value={medicalRecord.id}>
                                  {medicalRecord.patient_name_id}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Full Name */}
                    <div className="border-b border-gray-300">
                      <div className="flex">
                        <div className="w-2/5 bg-gray-50 p-3 border-r border-gray-300 font-medium text-sm">
                          Full Name:
                        </div>
                        <div className="flex-1 p-3">
                          <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed focus:outline-none text-sm"
                            value={choosedInvoice.patient_name}
                            readOnly
                            disabled
                          />
                        </div>
                      </div>
                    </div>

                    {/* Visit Date */}
                    <div className="border-b border-gray-300">
                      <div className="flex">
                        <div className="w-2/5 bg-gray-50 p-3 border-r border-gray-300 font-medium text-sm">
                          Visit Date:
                        </div>
                        <div className="flex-1 p-3">
                          <input
                            type="date"
                            className="w-full p-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed focus:outline-none text-sm"
                            value={choosedInvoice.examination_date}
                            readOnly
                            disabled
                          />
                        </div>
                      </div>
                    </div>

                    {/* Consultation Fee */}
                    <div className="border-b border-gray-300">
                      <div className="flex">
                        <div className="w-2/5 bg-gray-50 p-3 border-r border-gray-300 font-medium text-sm">
                          Consultation Fee:
                        </div>
                        <div className="flex-1 p-3">
                          <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed focus:outline-none text-sm"
                            value={choosedInvoice.examination_fee}
                            placeholder="Chọn hồ sơ bệnh nhân"
                            readOnly
                            disabled
                          />
                        </div>
                      </div>
                    </div>

                    {choosedInvoice.id != 0 && (
                      <div className="border-b border-gray-300">
                        <div className="flex">
                          <div className="w-2/5 bg-gray-50 p-3 border-r border-gray-300 font-medium text-sm">
                            Medicine Fee:
                          </div>
                          <div className="flex-1 p-3">
                            <input
                              type="text"
                              className="w-full p-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed focus:outline-none text-sm"
                              value={choosedInvoice.medicine_fee}
                              readOnly
                              disabled
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notes*/}
                    <div className="border-b border-gray-300">
                      <div className="flex">
                        <div className="w-2/5 bg-gray-50 p-3 border-r border-gray-300 font-medium text-sm">
                          Notes:
                        </div>
                        <div className="flex-1 p-3">
                          {choosedInvoice.status != "cancelled" && (
                            <input
                              type="text"
                              className="w-full p-2 border border-gray-300 rounded focus:outline-none text-sm"
                              value={choosedInvoice.notes}
                              onChange={(e) => {
                                setChoosedInvoice({
                                  ...choosedInvoice,
                                  notes: e.target.value,
                                });
                              }}
                            />
                          )}

                          {choosedInvoice.status == "cancelled" && (
                            <input
                              type="text"
                              className="w-full p-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed focus:outline-none text-sm"
                              value={choosedInvoice.notes}
                              readOnly
                              disabled
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {choosedInvoice.id != 0 && (
                      <div className="border-b border-gray-300">
                        <div className="flex">
                          <div className="w-2/5 bg-gray-50 p-3 border-r border-gray-300 font-medium text-sm">
                            Status:
                          </div>
                          <div className="flex-1 p-3">
                            <input
                              type="text"
                              className="w-full p-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed focus:outline-none text-sm"
                              value={choosedInvoice.status}
                              readOnly
                              disabled
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {!isAddingInvoice && choosedInvoice.status == "paid" && (
                      <div className="border-b border-gray-300">
                        <div className="flex">
                          <div className="w-2/5 bg-gray-50 p-3 border-r border-gray-300 font-medium text-sm">
                            Payment Date:
                          </div>
                          <div className="flex-1 p-3">
                            <input
                              type="date"
                              className="w-full p-2 border border-gray-300 rounded focus:outline-none text-sm"
                              value={choosedInvoice.payment_date}
                              onChange={(e) => {
                                setChoosedInvoice({
                                  ...choosedInvoice,
                                  payment_date: e.target.value,
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {!isAddingInvoice && (
                      <div className="bg-gray-50">
                        <div className="flex">
                          <div className="w-2/5 bg-gray-100 p-3 border-r border-gray-300 font-bold text-sm">
                            Total:
                          </div>
                          <div className="flex-1 p-3 font-bold text-sm">
                            {choosedInvoice.total_fee}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Section - Medicine Table */}
                  <div className="w-1/2">
                    {/* Medicine Table Header */}
                    <div className="bg-blue-500 text-white">
                      <div className="flex">
                        <div className="flex-1 p-2 text-center font-medium border-r border-blue-400 text-sm">
                          Medicine
                        </div>
                        <div className="w-16 p-2 text-center font-medium border-r border-blue-400 text-sm">
                          Unit
                        </div>
                        <div className="w-20 p-2 text-center font-medium border-r border-blue-400 text-sm">
                          Quantity
                        </div>
                        <div className="w-24 p-2 text-center font-medium text-sm">
                          Price
                        </div>
                      </div>
                    </div>

                    {/* Medicine Rows */}
                    {prescriptions.map((prescription, index) => (
                      <div key={index} className="border-b border-gray-300">
                        <div className="flex">
                          <div className="flex-1 p-1 border-r border-gray-300">
                            <input
                              type="text"
                              className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                              value={prescription.medicine_name}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="w-16 p-1 border-r border-gray-300">
                            <input
                              type="text"
                              className="w-full p-1 border border-gray-300 rounded bg-gray-100 cursor-not-allowed focus:outline-none text-sm"
                              value={prescription.medicine_unit}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="w-20 p-1 border-r border-gray-300">
                            <input
                              type="text"
                              className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                              value={prescription.quantity}
                              readOnly
                              disabled
                            />
                          </div>
                          <div className="w-24 p-1">
                            <input
                              type="text"
                              className="w-full p-1 border border-gray-300 rounded bg-gray-100 cursor-not-allowed focus:outline-none text-sm"
                              value={prescription.medicine_price}
                              readOnly
                              disabled
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {isAddingInvoice && (
                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleCreate}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 rounded font-medium transition-colors"
                  >
                    Create
                  </button>
                </div>
              )}

              {choosedInvoice.id != 0 && (
                <>
                  <div className="flex justify-end mt-6">
                    {choosedInvoice.status != "cancelled" && (
                      <button
                        onClick={handleUpdate}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 rounded font-medium transition-colors"
                      >
                        Update
                      </button>
                    )}
                    {choosedInvoice.status == "pending" && (
                      <>
                        <button
                          onClick={handleCancel}
                          className="bg-red-500 hover:bg-red-600 text-white px-8 py-2 rounded font-medium transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handlePayment}
                          className="bg-white hover:bg-blue-600 text-blue-500 px-8 py-2 rounded font-medium transition-colors border và border-blue-500"
                        >
                          Payment
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Invoice;
