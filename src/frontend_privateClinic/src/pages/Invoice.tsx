import { useEffect, useState } from "react";
import HeaderDashboard from "../components/HeaderDashboard";
import { useLocation } from "react-router-dom";
import { Search } from "lucide-react";
import Table from "../components/Table";
import { invoiceService } from "../api/invoice.service";
import { medicalRecordService } from "../api/medical_record.service";
import { settingService } from "../api/setting.service";
import { formatNumberWithThousandSeparator } from "../utils/currencyUtils.ts";
import {
  formatDateTimeForDisplay,
  formatDateForAPI,
  formatDateForDisplay,
} from "../utils/dateUtils.ts";
import { DateSearchInput, PatientSearchInput } from "../components/SearchBar";

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

interface SearchValues {
  date: string;
  name: string;
}

const Invoice = () => {
  const [searchValues, setSearchValues] = useState<SearchValues>({
    date: "",
    name: "",
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [invoices, setInvoices] = useState<Invoice_[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice_[]>([]);
  const [presentList, setPresentList] = useState<Invoice_[]>([]);
  const [choosedInvoice, setChoosedInvoice] =
    useState<Invoice_>(defaultInvoice);
  const [isAddingInvoice, setIsAddingInvoice] = useState(false);
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [examinationFee, setExaminationFee] = useState(0);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [choosedMedicalRecord, setChoosedMedicalRecord] =
    useState<MedicalRecord>(defaultMedicalRecord);
  const [update, setUpdate] = useState(0);

  // console.log("Date chosen: ", choosedMedicalRecord);

  const handleSearch = async () => {
    try {
      // Filter invoices based on search values
      const filtered = invoices.filter((invoice) => {
        const matchDate = searchValues.date
          ? (() => {
              // Use formatDateTimeForDisplay to get the date in dd/MM/yyyy format
              const invoiceDateDisplay = formatDateTimeForDisplay(
                invoice.examination_date
              );
              // Convert search date from yyyy-MM-dd to dd/MM/yyyy for comparison
              const searchDateDisplay = formatDateForDisplay(searchValues.date);
              return invoiceDateDisplay === searchDateDisplay;
            })()
          : true;

        const matchName = searchValues.name
          ? invoice.patient_name
              .toLowerCase()
              .includes(searchValues.name.toLowerCase())
          : true;

        return matchDate && matchName;
      });

      setPresentList(filtered);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const handleClear = () => {
    setSearchValues({
      date: "",
      name: "",
    });
    setSelectedDate(null);
    setPresentList(invoices);
  };

  useEffect(() => {
    const fetchInvoices = async () => {
      const invoices = await invoiceService.getInvoices();

      for (let i = 0; i < invoices.length; i++) {
        invoices[i].examination_date = invoices[i].examination_date;
        if (invoices[i].payment_date) {
          invoices[i].payment_date = invoices[i].payment_date;
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
    // console.log("Date: ", choosedMedicalRecord.examination_date);
    if (choosedMedicalRecord.id != 0) {
      setChoosedInvoice({
        ...defaultInvoice,
        patient_name: choosedMedicalRecord.patient_name,
        patient_id: choosedMedicalRecord.patient_id,
        examination_date: choosedMedicalRecord.examination_date,
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
    console.log(choosedInvoice.payment_date);
    try {
      await invoiceService.updateInvoice(choosedInvoice.id, {
        notes: choosedInvoice.notes,
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
    if (!isEditingInvoice) return; // Only allow selection when in editing mode

    for (let i = 0; i < presentList.length; i++) {
      if (presentList[i].id == id) {
        setChoosedInvoice(presentList[i]);
        break;
      }
    }
  };

  const formattedInvoices = presentList.map((invoice) => ({
    ...invoice,
    examination_fee: formatNumberWithThousandSeparator(
      Number(invoice.examination_fee)
    ),
    medicine_fee: formatNumberWithThousandSeparator(
      Number(invoice.medicine_fee)
    ),
    examination_date: formatDateTimeForDisplay(invoice.examination_date),
  }));

  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValues]);

  return (
    <div className="min-h-screen w-full">
      <HeaderDashboard currentUser={user} />
      <main className="container mx-auto px-8 py-6 mt-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Invoice List</h1>
        {/* Search Section */}
        <div className="mb-8 flex flex-wrap items-end gap-4">
          <DateSearchInput
            selectedDate={selectedDate}
            onChange={(date) => {
              setSelectedDate(date);
              if (date) {
                setSearchValues((prev) => ({
                  ...prev,
                  date: formatDateForAPI(date),
                }));
              } else {
                setSearchValues((prev) => ({
                  ...prev,
                  date: "",
                }));
              }
            }}
            label="Visit Date"
          />

          <PatientSearchInput
            value={searchValues.name}
            onChange={(value) => {
              setSearchValues((prev) => ({
                ...prev,
                name: value,
              }));
            }}
          />

          <div className="flex gap-4 ml-auto">
            <button
              type="button"
              onClick={handleClear}
              className="border border-[#1250B1] text-[#1250B1] px-6 py-2 rounded hover:bg-[#f0f6ff] cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {isEditingInvoice && (
          <p className="text-blue-600 font-semibold text-lg mt-4 mb-2">
            Select an invoice in the table below
          </p>
        )}

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <Table
            headers={[
              // "Invoice ID",
              "Patient Name",
              "Visit Date",
              "Consultant Fee",
              "Total Medicine Fee",
              "Status",
            ]}
            handleChoose={handleChoose}
            filteredItems={formattedInvoices}
            attributesOfItem={[
              // "id",
              "patient_name",
              "examination_date",
              "examination_fee",
              "medicine_fee",
              "status",
            ]}
            weights={[
              "w-[50px]",
              "w-[100px]",
              "w-[100px]",
              "w-[100px]",
              "w-[100px]",
              // "w-[300px]",
              "w-[100px]",
            ]}
            selectedItemId={choosedInvoice.id !== 0 ? choosedInvoice.id : null}
            isEditing={isEditingInvoice}
          />
        </div>

        <div className="mb-6 flex justify-between">
          <button
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              isAddingInvoice
                ? "bg-gray-500 text-white hover:bg-gray-600"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
            onClick={() => {
              if (isAddingInvoice) {
                // Cancel creating mode
                setIsAddingInvoice(false);
                setChoosedInvoice(defaultInvoice);
                setChoosedMedicalRecord(defaultMedicalRecord);
              } else {
                // Enter creating mode
                setIsAddingInvoice(true);
                setIsEditingInvoice(false);
              }
            }}
            disabled={isEditingInvoice}
          >
            {isAddingInvoice ? "Cancel Creating" : "Create new invoice"}
          </button>

          <button
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              isEditingInvoice
                ? "bg-gray-500 text-white hover:bg-gray-600"
                : "bg-[#1250B1] text-white hover:bg-blue-700"
            }`}
            onClick={() => {
              if (isEditingInvoice) {
                // Cancel editing mode
                setIsEditingInvoice(false);
                setChoosedInvoice(defaultInvoice);
              } else {
                // Enter editing mode
                setIsEditingInvoice(true);
                setIsAddingInvoice(false);
              }
            }}
            disabled={isAddingInvoice}
          >
            {isEditingInvoice ? "Cancel Editing" : "Edit"}
          </button>
        </div>

        {/* Invoice Form Section */}
        {(choosedInvoice.id != 0 || isAddingInvoice) && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              {/* Header */}
              <div
                className={`${
                  isAddingInvoice ? "bg-blue-500" : "bg-[#1250B1]"
                } text-white text-center py-3`}
              >
                <h2 className="text-xl font-semibold">
                  {isAddingInvoice ? "Create Invoice" : "Edit Invoice"}
                </h2>
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
                              for (let i = 0; i < medicalRecords.length; i++) {
                                if (
                                  Number(e.target.value) == medicalRecords[i].id
                                ) {
                                  setChoosedMedicalRecord(medicalRecords[i]);
                                }
                              }
                            }}
                          >
                            <option value={0}>--Choose a medical record</option>
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
                        Patient Name:
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
                          type="text"
                          className="w-full p-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed focus:outline-none text-sm"
                          value={formatDateTimeForDisplay(
                            choosedInvoice.examination_date
                          )}
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
                          value={formatNumberWithThousandSeparator(
                            choosedInvoice.examination_fee
                          )}
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
                            value={formatNumberWithThousandSeparator(
                              choosedInvoice.medicine_fee
                            )}
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
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed focus:outline-none text-sm"
                            value={formatDateTimeForDisplay(
                              choosedInvoice.payment_date
                            )}
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
                          {formatNumberWithThousandSeparator(
                            choosedInvoice.total_fee
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Section - Medicine Table */}
                <div className="w-1/2">
                  {/* Medicine Table Header */}
                  <div
                    className={`${
                      isAddingInvoice ? "bg-blue-500" : "bg-[#1250B1]"
                    } text-white`}
                  >
                    <div className="flex">
                      <div className="flex-1 p-2 text-center font-medium border-r border-white-400 text-sm">
                        Medicine
                      </div>
                      <div className="w-16 p-2 text-center font-medium border-r border-white-400 text-sm">
                        Unit
                      </div>
                      <div className="w-20 p-2 text-center font-medium border-r border-white-400 text-sm">
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
                            value={formatNumberWithThousandSeparator(
                              prescription.medicine_price
                            )}
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
                      className="bg-[#1250B1] hover:bg-blue-600 text-white px-8 py-2 rounded font-medium transition-colors"
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
          </div>
        )}
      </main>
    </div>
  );
};

export default Invoice;
