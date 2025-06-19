import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import HeaderDashboard from "../components/HeaderDashboard";
// import {
//   getPatientExaminationByName,
//   getMedicines,
// } from "../api/medical_examination.service.ts";
import type { PatientExaminationHistory } from "../api/patient.service";
import AppointmentSelectionModal from "../components/AppointmentSelectionModal";
import {
  appointmentService,
  type Appointment,
} from "../api/appointment.service";
import {
  diseaseTypeService,
  type DiseaseType,
} from "../api/diseaseType.service";
import { formatDateTimeForDisplay } from "../utils/dateUtils";
import { formatNumberWithThousandSeparator } from "../utils/currencyUtils.ts";
import MedicineSearchInput from "../components/SearchBar/MedicineSearchInput";
import { medicalRecordService } from "../api/medicalRecord.service";
import { getCurrentStaffId } from "../api/auth.service";
import {
  usageInstructionService,
  type UsageInstruction,
} from "../api/usageInstruction.service";
import { prescriptionService } from "../api/prescription.service";
// import { settingService } from "../api/setting.service";
import { medicineService } from "../api/medicine.service";

interface Medicine {
  id: number;
  name: string;
  unit: string;
  price: number;
  quantity_in_stock: number;
  description: string;
}

interface PrescriptionItem extends Medicine {
  quantity: number;
  usage: string;
}

const MedicalExamination: React.FC = () => {
  const location = useLocation();
  const { user } = location.state || {};

  // Patient info
  const initialPatient = {
    id: 0,
    "Họ Tên": "",
    "Ngày Khám": "",
    "Loại Bệnh": "",
    "Triệu Chứng": "",
  };
  const [patient, setPatient] =
    useState<PatientExaminationHistory>(initialPatient);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Appointment modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [appointmentError, setAppointmentError] = useState("");

  // Medicine states
  const [search, setSearch] = useState("");
  const [prescription, setPrescription] = useState<PrescriptionItem[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medicineLoading, setMedicineLoading] = useState(true);
  const [medicineError, setMedicineError] = useState<string | null>(null);

  // Disease types states
  const [diseaseTypes, setDiseaseTypes] = useState<DiseaseType[]>([]);
  const [diseaseTypesLoading, setDiseaseTypesLoading] = useState(true);
  const [diseaseTypesError, setDiseaseTypesError] = useState<string | null>(
    null
  );

  // Disease dropdown states
  const [isDiseaseDropdownOpen, setIsDiseaseDropdownOpen] = useState(false);
  const [diseaseSearchTerm, setDiseaseSearchTerm] = useState("");
  const diseaseDropdownRef = useRef<HTMLDivElement>(null);

  // Show prescription section
  const [showPrescriptionSection, setShowPrescriptionSection] = useState(false);

  // Usage instructions state
  const [usageInstructions, setUsageInstructions] = useState<
    UsageInstruction[]
  >([]);
  const [usageInstructionsLoading, setUsageInstructionsLoading] =
    useState(true);
  const [usageInstructionsError, setUsageInstructionsError] = useState<
    string | null
  >(null);

  // Usage dropdown state for each prescription item
  const [openUsageDropdownId, setOpenUsageDropdownId] = useState<number | null>(
    null
  );
  const [usageSearchTerm, setUsageSearchTerm] = useState("");
  const usageDropdownRefs = useRef<{ [id: number]: HTMLDivElement | null }>({});

  // Fetch medicines on component mount
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const data = await medicineService.getMedicines();
        setMedicines(data.map((m) => ({ ...m, price: Number(m.price) })));
      } catch (err: any) {
        setMedicineError(err.message || "Không thể lấy danh sách thuốc");
      } finally {
        setMedicineLoading(false);
      }
    };
    fetchMedicines();
  }, []);

  // Fetch disease types on component mount
  useEffect(() => {
    const fetchDiseaseTypes = async () => {
      try {
        const data = await diseaseTypeService.getDiseaseTypes(); // data là DiseaseType[]
        setDiseaseTypes(data);
      } catch (err: any) {
        setDiseaseTypesError(
          err.message || "Không thể lấy danh sách loại bệnh"
        );
      } finally {
        setDiseaseTypesLoading(false);
      }
    };
    fetchDiseaseTypes();
  }, []);

  // Fetch appointments when modal opens
  useEffect(() => {
    if (isModalOpen) {
      const fetchAppointments = async () => {
        try {
          setAppointmentLoading(true);
          setAppointmentError("");
          const allAppointments = await appointmentService.getAppointments();
          const filteredAppointments = allAppointments.filter(
            (a) => a.status === "in_progress"
          );
          setAppointments(filteredAppointments);
        } catch (err: any) {
          setAppointmentError(err.message || "Failed to fetch appointments");
        } finally {
          setAppointmentLoading(false);
        }
      };
      fetchAppointments();
    }
  }, [isModalOpen]);

  // Fetch usage instructions on mount
  useEffect(() => {
    const fetchUsageInstructions = async () => {
      try {
        const data = await usageInstructionService.getUsageInstructions();
        setUsageInstructions(data);
      } catch (err: any) {
        setUsageInstructionsError(
          err.message || "Không thể lấy hướng dẫn sử dụng"
        );
      } finally {
        setUsageInstructionsLoading(false);
      }
    };
    fetchUsageInstructions();
  }, []);

  // Handle appointment selection
  const handleAppointmentSelect = (appointment: Appointment) => {
    setPatient({
      id: appointment.id,
      "Họ Tên": appointment.patient_name,
      "Ngày Khám": formatDateTimeForDisplay(appointment.appointment_date),
      "Loại Bệnh": "",
      "Triệu Chứng": "",
    });
  };

  // Show full list of drugs
  const displayedMedicines =
    search.trim() === ""
      ? medicines
      : medicines.filter(
          (m) =>
            m.name.toLowerCase().includes(search.toLowerCase()) ||
            m.id.toString().toLowerCase().includes(search.toLowerCase())
        );

  // Medicine cost calculation
  const medicineCost = prescription.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  // Filter disease types based on search term
  const filteredDiseaseTypes = diseaseTypes.filter((disease) =>
    disease.name.toLowerCase().includes(diseaseSearchTerm.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        diseaseDropdownRef.current &&
        !diseaseDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDiseaseDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle disease selection
  const handleDiseaseSelect = (diseaseName: string) => {
    setPatient({ ...patient, "Loại Bệnh": diseaseName });
    setIsDiseaseDropdownOpen(false);
    setDiseaseSearchTerm("");
  };

  // Close dropdown when click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openUsageDropdownId !== null &&
        usageDropdownRefs.current[openUsageDropdownId] &&
        !usageDropdownRefs.current[openUsageDropdownId]?.contains(
          event.target as Node
        )
      ) {
        setOpenUsageDropdownId(null);
        setUsageSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openUsageDropdownId]);

  const handleFinish = async () => {
    if (
      !patient.id ||
      !patient["Ngày Khám"] ||
      !patient["Triệu Chứng"] ||
      !patient["Loại Bệnh"]
    ) {
      alert(
        "Vui lòng điền đầy đủ thông tin bệnh nhân, ngày khám, triệu chứng và chẩn đoán."
      );
      return;
    }
    // Find disease_type_id by name
    const diseaseType = diseaseTypes.find(
      (dt) => dt.name === patient["Loại Bệnh"]
    );
    if (!diseaseType) {
      alert("Không tìm thấy loại bệnh phù hợp.");
      return;
    }
    // Convert date to YYYY-MM-DD
    const [day, month, year] = patient["Ngày Khám"].split("/");
    const examination_date = `${year}-${month.padStart(2, "0")}-${day.padStart(
      2,
      "0"
    )}`;

    // Get staff_id from auth service
    const staff_id = getCurrentStaffId();
    if (!staff_id) {
      alert("Không xác định được nhân viên đăng nhập.");
      return;
    }

    try {
      // 1. Tạo medical record
      const medicalRecordRes = await medicalRecordService.createMedicalRecord({
        patient_id: patient.id,
        examination_date,
        symptoms: patient["Triệu Chứng"],
        diagnosis: patient["Loại Bệnh"],
        disease_type_id: diseaseType.id,
        staff_id,
        status: "pending",
      });
      const medical_record_id =
        medicalRecordRes.id || medicalRecordRes.data?.id;
      if (!prescription.length) {
        alert("Tạo hồ sơ bệnh án thành công!");
        // Reset form
        setPatient(initialPatient);
        setPrescription([]);
        setShowPrescriptionSection(false);
        setSearch("");
        return;
      }
      // 2. Tạo prescription cho từng thuốc
      for (const item of prescription) {
        const usageInstruction = usageInstructions.find(
          (ui) => ui.instruction === item.usage
        );
        if (!usageInstruction) {
          alert(`Không tìm thấy hướng dẫn sử dụng cho thuốc ${item.name}`);
          return;
        }
        await prescriptionService.createPrescription({
          medical_record_id,
          medicine_id: item.id,
          staff_id,
          quantity: item.quantity,
          usage_instruction_id: usageInstruction.id,
          notes: usageInstruction.description || "",
        });
      }
      alert("Tạo hồ sơ bệnh án và đơn thuốc thành công!");
      // Reset form
      setPatient(initialPatient);
      setPrescription([]);
      setShowPrescriptionSection(false);
      setSearch("");
    } catch (err: any) {
      alert(
        "Tạo hồ sơ bệnh án hoặc đơn thuốc thất bại!\n" +
          (err?.response?.data?.message || err.message)
      );
    }
  };

  const isFinishDisabled =
    !patient["Triệu Chứng"] ||
    !patient["Loại Bệnh"] ||
    (prescription.length > 0 &&
      prescription.some(
        (item) =>
          !item.usage ||
          !usageInstructions.find((ui) => ui.instruction === item.usage)
            ?.description
      ));

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <HeaderDashboard currentUser={user} />
      <main className="container mx-auto px-8 py-6 mt-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Medical Examination Form
        </h1>
        {/* Select Appointment Button */}
        <div className="flex items-center gap-2 mt-4 mb-2">
          <button
            className="w-50 bg-blue-500 text-white rounded px-6 py-2 hover:bg-blue-700 transition-colors flex items-center gap-2"
            onClick={() => setIsModalOpen(true)}
          >
            {/* Magnifying glass icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            Select Patient
          </button>
        </div>

        {/* Appointment Selection Modal */}
        <AppointmentSelectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelectAppointment={handleAppointmentSelect}
          appointments={appointments}
          isLoading={appointmentLoading}
          error={appointmentError}
        />

        {/* Header */}
        <div className="bg-[#1250B1] text-white rounded-t-lg px-6 py-3 text-lg font-semibold text-center">
          Medical Examination Form
        </div>

        {/* Patient Info Table */}
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : (
          <table className="w-full border border-blue-500">
            <tbody>
              <tr className="border-b border-blue-500">
                <td className="font-bold px-4 py-2 w-1/4 text-gray-900">
                  Patient Name:
                </td>
                <td className="px-4 py-2 w-1/4 text-gray-900 border-r border-r-blue-500">
                  {patient["Họ Tên"]}
                </td>
                <td className="font-bold px-4 py-2 w-1/4 text-gray-900">
                  Visit Date:
                </td>
                <td className="px-4 py-2 w-1/4 text-gray-900">
                  {patient["Ngày Khám"]}
                </td>
              </tr>
              <tr className="border-blue-500">
                <td className="font-bold px-4 py-2 text-gray-900">Symptoms:</td>
                <td className="px-4 py-2 text-gray-900 border-r border-r-blue-500">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring focus:ring-blue-300 placeholder-gray-400"
                    placeholder="Enter patient's symptoms..."
                    value={patient["Triệu Chứng"]}
                    onChange={(e) =>
                      setPatient({ ...patient, "Triệu Chứng": e.target.value })
                    }
                  />
                </td>
                <td className="font-bold px-4 py-2 text-gray-900">
                  Diagnosed Illness:
                </td>
                <td className="px-4 py-2 text-gray-900">
                  <div className="relative" ref={diseaseDropdownRef}>
                    <div
                      className="w-full border border-gray-300 rounded px-2 py-1 focus-within:outline-none focus-within:ring focus-within:ring-blue-300 cursor-pointer bg-white flex items-center justify-between"
                      onClick={() =>
                        setIsDiseaseDropdownOpen(!isDiseaseDropdownOpen)
                      }
                    >
                      <span
                        className={
                          patient["Loại Bệnh"]
                            ? "text-gray-900"
                            : "text-gray-400"
                        }
                      >
                        {patient["Loại Bệnh"] || "-- Select disease type --"}
                      </span>
                      <svg
                        className={`w-4 h-4 text-gray-500 transition-transform ${
                          isDiseaseDropdownOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>

                    {isDiseaseDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
                        {/* Search input */}
                        <div className="p-2 border-b border-gray-200">
                          <input
                            type="text"
                            placeholder="Search disease types..."
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-300"
                            value={diseaseSearchTerm}
                            onChange={(e) =>
                              setDiseaseSearchTerm(e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>

                        {/* Disease list */}
                        <div className="max-h-36 overflow-y-auto">
                          {diseaseTypesLoading ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              Loading disease types...
                            </div>
                          ) : diseaseTypesError ? (
                            <div className="px-3 py-2 text-sm text-red-500">
                              {diseaseTypesError}
                            </div>
                          ) : filteredDiseaseTypes.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              {diseaseSearchTerm
                                ? "No matching disease types found"
                                : "No disease types available"}
                            </div>
                          ) : (
                            filteredDiseaseTypes.map((disease) => (
                              <div
                                key={disease.id}
                                className="px-3 py-2 text-sm text-gray-900 text-left hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                onClick={() =>
                                  handleDiseaseSelect(disease.name)
                                }
                              >
                                {disease.name}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {diseaseTypesError && (
                    <div className="text-red-500 text-xs mt-1">
                      {diseaseTypesError}
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {/* Add/Remove prescription button ở bên phải, cùng hàng, không còn Consultation Fee */}
        <div className="flex justify-end mt-4 mb-2">
          <button
            className={`rounded px-6 py-2 font-semibold transition-colors ${
              showPrescriptionSection
                ? "bg-white text-red-500 border border-red-300 hover:bg-red-200"
                : "bg-[#1250B1] text-white hover:bg-blue-700"
            }`}
            onClick={() => {
              if (showPrescriptionSection) {
                setShowPrescriptionSection(false);
                setPrescription([]);
              } else {
                setShowPrescriptionSection(true);
              }
            }}
          >
            {showPrescriptionSection
              ? "Remove prescription"
              : "Add prescription"}
          </button>
        </div>

        {/* Show prescription section only if showPrescriptionSection is true */}
        {showPrescriptionSection && (
          <>
            {/* Prescription Section Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-6 mt-16">
              Add Prescription
            </h1>

            {/* Medicine Search Section */}
            <div className="w-70 mt-4 mb-2">
              <MedicineSearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search medicines..."
              />
            </div>

            {/* Medicine Table */}
            <div className="max-h-48 overflow-y-auto border border-blue-500">
              <table className="w-full medicine-table">
                <thead className="bg-blue-500 text-white">
                  <tr>
                    <th className="px-4 py-2 sticky top-0 z-10 bg-[#1250B1]">
                      Code
                    </th>
                    <th className="px-4 py-2 sticky top-0 z-10 bg-[#1250B1]">
                      Medicine
                    </th>
                    <th className="px-4 py-2 sticky top-0 z-10 bg-[#1250B1]">
                      Unit
                    </th>
                    <th className="px-4 py-2 sticky top-0 z-10 bg-[#1250B1]">
                      Price (VND)
                    </th>
                    <th className="px-4 py-2 sticky top-0 z-10 bg-[#1250B1]">
                      Stock
                    </th>
                    <th className="px-4 py-2 sticky top-0 z-10 bg-[#1250B1]">
                      Description
                    </th>
                    <th className="px-4 py-2 sticky top-0 z-10 bg-[#1250B1]">
                      Select
                    </th>
                  </tr>
                </thead>
                <tbody className="medicine-table-body">
                  {medicineLoading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-4 text-gray-400"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : medicineError ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-red-500">
                        {medicineError}
                      </td>
                    </tr>
                  ) : displayedMedicines.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-4 text-gray-400"
                      >
                        No medicines found
                      </td>
                    </tr>
                  ) : (
                    displayedMedicines.map((m) => (
                      <tr key={m.id} className="border-b border-blue-500">
                        <td className="px-4 py-2 text-center text-gray-900">
                          {m.id}
                        </td>
                        <td className="px-4 py-2 text-center text-gray-900">
                          {m.name}
                        </td>
                        <td className="px-4 py-2 text-center text-gray-900">
                          {m.unit}
                        </td>
                        <td className="px-4 py-2 text-center text-gray-900">
                          {formatNumberWithThousandSeparator(
                            m.price.toLocaleString()
                          )}
                        </td>
                        <td className="px-4 py-2 text-center text-gray-900">
                          {m.quantity_in_stock}
                        </td>
                        <td className="px-4 py-2 text-center text-gray-900">
                          {m.description}
                        </td>
                        <td className="px-4 py-2 text-center text-gray-900 relative">
                          <div className="relative flex items-center justify-center">
                            <input
                              type="checkbox"
                              className="peer appearance-none w-5 h-5 bg-white border-2 border-blue-500 rounded transition checked:bg-blue-500 checked:border-blue-500 select-checkbox"
                              checked={prescription.some(
                                (item) => item.id === m.id
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  // Add to prescription if not already present
                                  if (
                                    !prescription.some(
                                      (item) => item.id === m.id
                                    )
                                  ) {
                                    setPrescription((prev) => [
                                      ...prev,
                                      { ...m, quantity: 1, usage: "" },
                                    ]);
                                  }
                                } else {
                                  // Remove from prescription
                                  setPrescription((prev) =>
                                    prev.filter((item) => item.id !== m.id)
                                  );
                                }
                              }}
                            />
                            <svg
                              className="hidden peer-checked:block absolute pointer-events-none w-3 h-3 text-white"
                              style={{
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                zIndex: 20,
                              }}
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M4 8.5L7 11.5L12 6.5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Prescription Table */}
            <div className="font-bold text-blue-500 mb-2 mt-6">
              Prescription
            </div>
            <table className="w-full border border-blue-500 mb-2">
              <thead className="bg-[#1250B1] text-white">
                <tr>
                  <th className="px-4 py-2">No.</th>
                  <th className="px-4 py-2">Medicine</th>
                  <th className="px-4 py-2">Unit</th>
                  <th className="px-4 py-2">Quantity</th>
                  <th className="px-4 py-2">Usage</th>
                  <th className="px-4 py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {prescription.map((item, idx) => (
                  <tr key={item.id} className="border-b border-blue-500">
                    <td className="px-4 py-2 text-center text-gray-900">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-2 text-center text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-2 text-center text-gray-900">
                      {item.unit}
                    </td>
                    <td className="px-4 py-2 text-center text-gray-900">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="bg-blue-100 text-blue-500 rounded px-2 py-1 font-bold"
                          onClick={() => {
                            if (item.quantity === 1) {
                              setPrescription((prev) =>
                                prev.filter((i) => i.id !== item.id)
                              );
                            } else {
                              setPrescription((prev) =>
                                prev.map((i) =>
                                  i.id === item.id
                                    ? { ...i, quantity: i.quantity - 1 }
                                    : i
                                )
                              );
                            }
                          }}
                          type="button"
                        >
                          -
                        </button>
                        <span className="mx-2">{item.quantity || 1}</span>
                        <button
                          className="bg-blue-100 text-blue-500 rounded px-2 py-1 font-bold"
                          onClick={() =>
                            setPrescription((prev) =>
                              prev.map((i) =>
                                i.id === item.id
                                  ? { ...i, quantity: i.quantity + 1 }
                                  : i
                              )
                            )
                          }
                          type="button"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center text-gray-900">
                      <div
                        className="relative"
                        ref={(el) => {
                          usageDropdownRefs.current[item.id] = el;
                        }}
                      >
                        <div
                          className="w-full border border-gray-300 rounded px-2 py-1 focus-within:outline-none focus-within:ring focus-within:ring-blue-300 cursor-pointer bg-white flex items-center justify-between"
                          onClick={() => {
                            setOpenUsageDropdownId(item.id);
                            setUsageSearchTerm("");
                          }}
                        >
                          <span
                            className={
                              item.usage ? "text-gray-900" : "text-gray-400"
                            }
                          >
                            {item.usage || "-- Select usage instruction --"}
                          </span>
                          <svg
                            className={`w-4 h-4 text-gray-500 transition-transform ${
                              openUsageDropdownId === item.id
                                ? "rotate-180"
                                : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                        {openUsageDropdownId === item.id && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
                            {/* Search input */}
                            <div className="p-2 border-b border-gray-200">
                              <input
                                type="text"
                                placeholder="Search usage instructions..."
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-300"
                                value={usageSearchTerm}
                                onChange={(e) =>
                                  setUsageSearchTerm(e.target.value)
                                }
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                              />
                            </div>
                            {/* Usage instructions list */}
                            <div className="max-h-48 overflow-y-auto">
                              {usageInstructionsLoading ? (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  Loading usage instructions...
                                </div>
                              ) : usageInstructionsError ? (
                                <div className="px-3 py-2 text-sm text-red-500">
                                  {usageInstructionsError}
                                </div>
                              ) : usageInstructions.filter((ui) =>
                                  ui.instruction
                                    .toLowerCase()
                                    .includes(usageSearchTerm.toLowerCase())
                                ).length === 0 ? (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  {usageSearchTerm
                                    ? "No matching usage instructions found"
                                    : "No usage instructions available"}
                                </div>
                              ) : (
                                usageInstructions
                                  .filter((ui) =>
                                    ui.instruction
                                      .toLowerCase()
                                      .includes(usageSearchTerm.toLowerCase())
                                  )
                                  .map((ui) => (
                                    <div
                                      key={ui.id}
                                      className="px-3 py-2 text-sm text-gray-900 text-left hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                      onClick={() => {
                                        setPrescription((prev) =>
                                          prev.map((i) =>
                                            i.id === item.id
                                              ? { ...i, usage: ui.instruction }
                                              : i
                                          )
                                        );
                                        setOpenUsageDropdownId(null);
                                        setUsageSearchTerm("");
                                      }}
                                    >
                                      {ui.instruction}
                                    </div>
                                  ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {usageInstructionsError && (
                        <div className="text-red-500 text-xs mt-1">
                          {usageInstructionsError}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center text-gray-900 text-sm">
                      {usageInstructions.find(
                        (ui) => ui.instruction === item.usage
                      )?.description || ""}
                    </td>
                  </tr>
                ))}
                {prescription.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-gray-400">
                      No medicines added
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}

        {/* Medicine Cost & Finish Button */}
        <div className="flex justify-between items-center mt-6">
          <div className="font-bold text-black">
            Medicine cost:{" "}
            <span className="font-normal">
              {medicineCost.toLocaleString()} VND
            </span>
          </div>
          <button
            className={`bg-[#1250B1] text-white rounded px-8 py-2 font-semibold hover:bg-blue-700 ${
              isFinishDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={handleFinish}
            disabled={isFinishDisabled}
          >
            Finish
          </button>
        </div>
      </main>
    </div>
  );
};

export default MedicalExamination;
