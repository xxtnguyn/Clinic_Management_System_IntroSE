import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import HeaderDashboard from "../components/HeaderDashboard";
import { getPatientExaminationByName, getMedicines } from "../api/medical_examination.service.ts";
import type { PatientExaminationHistory } from "../api/patient.service";

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

const consultationFee = 30000;

const MedicalExamination: React.FC = () => {
  const location = useLocation();
  const { user } = location.state || {};

  // Patient info
  const [patient, setPatient] = useState<PatientExaminationHistory>({
    id: 0,
    "Họ Tên": "",
    "Ngày Khám": "",
    "Loại Bệnh": "",
    "Triệu Chứng": "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Separate search states
  const [searchTop, setSearchTop] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMedicines, setSelectedMedicines] = useState<string[]>([]);
  const [prescription, setPrescription] = useState<PrescriptionItem[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medicineLoading, setMedicineLoading] = useState(true);
  const [medicineError, setMedicineError] = useState<string | null>(null);

  // Fetch patient data when searchTop changes
  const handleSearchPatient = async () => {
    if (!searchTop.trim()) {
      setError("Vui lòng nhập tên bệnh nhân để tìm kiếm");
      setPatient({
        id: 0,
        "Họ Tên": "",
        "Ngày Khám": "",
        "Loại Bệnh": "",
        "Triệu Chứng": "",
      });
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const patientData = await getPatientExaminationByName(searchTop);
      if (patientData.length > 0) {
        setPatient(patientData[0]);
      } else {
        setError("Không tìm thấy bệnh nhân với tên này");
        setPatient({
          id: 0,
          "Họ Tên": "",
          "Ngày Khám": "",
          "Loại Bệnh": "",
          "Triệu Chứng": "",
        });
      }
    } catch (err: any) {
      setError(err.message || "Không thể lấy dữ liệu bệnh nhân");
      setPatient({
        id: 0,
        "Họ Tên": "",
        "Ngày Khám": "",
        "Loại Bệnh": "",
        "Triệu Chứng": "",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch medicines on component mount
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const data = await getMedicines();
        setMedicines(data);
      } catch (err: any) {
        setMedicineError(err.message || "Không thể lấy danh sách thuốc");
      } finally {
        setMedicineLoading(false);
      }
    };
    fetchMedicines();
  }, []);

  // Show full list of drugs
  const displayedMedicines = search.trim() === "" ? medicines : medicines.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.id.toString().toLowerCase().includes(search.toLowerCase())
  );

  // Add selected medicines to prescription
  const handleAddIn = () => {
    const newItems = displayedMedicines.filter((m) =>
      selectedMedicines.includes(m.id.toString())
    );
    const newPrescription = [
      ...prescription,
      ...newItems.map((m) => ({ ...m, quantity: 1, usage: "" })),
    ];
    setPrescription(newPrescription);
    setSelectedMedicines([]);
  };

  // Update prescription quantity/usage
  const updatePrescription = (idx: number, field: string, value: any) => {
    setPrescription((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      )
    );
  };

  // Remove duplicates in prescription
  const uniquePrescription = prescription.filter(
    (item, idx, arr) =>
      arr.findIndex((x) => x.id === item.id) === idx
  );

  // Medicine cost calculation
  const medicineCost = uniquePrescription.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );
  const totalCost = consultationFee + medicineCost;

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <HeaderDashboard currentUser={user} />
      <main className="container mx-auto px-8 py-6 mt-16">
        {/* Top Search Bar */}
        <div className="flex items-center gap-2 mt-4 mb-2">
          <input
            type="text"
            placeholder="Search..."
            className="border border-blue-500 rounded px-4 py-2 w-64 text-blue-500 focus:outline-none"
            value={searchTop}
            onChange={(e) => setSearchTop(e.target.value)}
          />
          <span className="italic text-blue-400 ml-2">Based on</span>
          <button className="bg-blue-100 text-blue-500 rounded px-4 py-2 font-semibold ml-2" disabled>
            Full Name
          </button>
          <button
            className="bg-blue-500 text-white rounded px-6 py-2 ml-2"
            onClick={handleSearchPatient}
          >
            Search
          </button>
        </div>
        {/* Header */}
        <div className="bg-blue-500 text-white rounded-t-lg px-6 py-3 text-lg font-semibold text-center">
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
                <td className="font-bold px-4 py-2 w-1/4 text-gray-900">Full Name:</td>
                <td className="px-4 py-2 w-1/4 text-gray-900 border-r border-r-blue-500">{patient["Họ Tên"]}</td>
                <td className="font-bold px-4 py-2 w-1/4 text-gray-900">Visit Date:</td>
                <td className="px-4 py-2 w-1/4 text-gray-900">{patient["Ngày Khám"]}</td>
              </tr>
              <tr className="border-blue-500">
                <td className="font-bold px-4 py-2 text-gray-900">Symptoms:</td>
                <td className="px-4 py-2 text-gray-900 border-r border-r-blue-500">{patient["Triệu Chứng"]}</td>
                <td className="font-bold px-4 py-2 text-gray-900">Diagnosed Illness:</td>
                <td className="px-4 py-2 text-gray-900">{patient["Loại Bệnh"]}</td>
              </tr>
            </tbody>
          </table>
        )}
        {/* Consultation Fee */}
        <div className="mt-4 mb-2 font-bold text-black">
          Consultation Fee: <span className="font-normal">{consultationFee.toLocaleString()} VND</span>
        </div>
        {/* Medicine Search Section */}
        <div className="flex items-center gap-2 mt-4 mb-2">
          <input
            type="text"
            placeholder="Search..."
            className="border border-blue-500 rounded px-4 py-2 w-64 text-blue-500 focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="italic text-blue-400 ml-2">Based on</span>
          <button className="bg-blue-100 text-blue-500 rounded px-4 py-2 font-semibold ml-2" disabled>
            Medicine
          </button>
          <button className="bg-blue-500 text-white rounded px-6 py-2 ml-2">Search</button>
        </div>
        {/* Medicine Table */}
        <div className="max-h-48 overflow-y-auto border border-blue-500">
          <table className="w-full medicine-table">
            <thead className="bg-blue-500 text-white">
              <tr>
                <th className="px-4 py-2 sticky top-0 z-10 bg-blue-500">Code</th>
                <th className="px-4 py-2 sticky top-0 z-10 bg-blue-500">Medicine</th>
                <th className="px-4 py-2 sticky top-0 z-10 bg-blue-500">Unit</th>
                <th className="px-4 py-2 sticky top-0 z-10 bg-blue-500">Price (VND)</th>
                <th className="px-4 py-2 sticky top-0 z-10 bg-blue-500">Stock</th>
                <th className="px-4 py-2 sticky top-0 z-10 bg-blue-500">Description</th>
                <th className="px-4 py-2 sticky top-0 z-10 bg-blue-500">Select</th>
              </tr>
            </thead>
            <tbody className="medicine-table-body">
              {medicineLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-400">Loading...</td>
                </tr>
              ) : medicineError ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-red-500">{medicineError}</td>
                </tr>
              ) : displayedMedicines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-400">No medicines found</td>
                </tr>
              ) : (
                displayedMedicines.map((m) => (
                  <tr key={m.id} className="border-b border-blue-500">
                    <td className="px-4 py-2 text-center text-gray-900">{m.id}</td>
                    <td className="px-4 py-2 text-center text-gray-900">{m.name}</td>
                    <td className="px-4 py-2 text-center text-gray-900">{m.unit}</td>
                    <td className="px-4 py-2 text-center text-gray-900">{m.price.toLocaleString()}</td>
                    <td className="px-4 py-2 text-center text-gray-900">{m.quantity_in_stock}</td>
                    <td className="px-4 py-2 text-center text-gray-900">{m.description}</td>
                    <td className="px-4 py-2 text-center text-gray-900 relative">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="peer appearance-none w-5 h-5 bg-white border-2 border-blue-500 rounded transition checked:bg-blue-500 checked:border-blue-500 select-checkbox"
                          checked={selectedMedicines.includes(m.id.toString())}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMedicines([...selectedMedicines, m.id.toString()]);
                            } else {
                              setSelectedMedicines(selectedMedicines.filter((c) => c !== m.id.toString()));
                            }
                          }}
                        />
                        <svg
                          className="hidden peer-checked:block absolute pointer-events-none w-3 h-3 text-white"
                          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 20 }}
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
        <div className="flex justify-center mb-4">
          <button
            className="bg-blue-500 text-white rounded px-8 py-2 font-semibold hover:bg-blue-600"
            onClick={handleAddIn}
            type="button"
            disabled={selectedMedicines.length === 0}
          >
            Add in
          </button>
        </div>
        {/* Prescription Table */}
        <div className="font-bold text-blue-500 mb-2 mt-6">Prescription</div>
        <table className="w-full border border-blue-500 mb-2">
          <thead className="bg-blue-500 text-white">
            <tr>
              <th className="px-4 py-2">No.</th>
              <th className="px-4 py-2">Medicine</th>
              <th className="px-4 py-2">Unit</th>
              <th className="px-4 py-2">Quantity</th>
              <th className="px-4 py-2">Usage</th>
            </tr>
          </thead>
          <tbody>
            {uniquePrescription.map((item, idx) => (
              <tr key={item.id} className="border-b border-blue-500">
                <td className="px-4 py-2 text-center text-gray-900">{idx + 1}</td>
                <td className="px-4 py-2 text-center text-gray-900">{item.name}</td>
                <td className="px-4 py-2 text-center text-gray-900">{item.unit}</td>
                <td className="px-4 py-2 text-center text-gray-900">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      className="bg-blue-100 text-blue-500 rounded px-2 py-1 font-bold"
                      onClick={() =>
                        updatePrescription(idx, "quantity", Math.max(1, (item.quantity || 1) - 1))
                      }
                      type="button"
                    >
                      -
                    </button>
                    <span className="mx-2">{item.quantity || 1}</span>
                    <button
                      className="bg-blue-100 text-blue-500 rounded px-2 py-1 font-bold"
                      onClick={() =>
                        updatePrescription(idx, "quantity", (item.quantity || 1) + 1)
                      }
                      type="button"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="px-4 py-2 text-center text-gray-900">
                  <input
                    type="text"
                    className="border border-gray-300 rounded px-2 py-1 w-full"
                    placeholder="Type here..."
                    value={item.usage}
                    onChange={(e) => updatePrescription(idx, "usage", e.target.value)}
                  />
                </td>
              </tr>
            ))}
            {uniquePrescription.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-400">No medicines added</td>
              </tr>
            )}
          </tbody>
        </table>
        {/* Medicine Cost & Total Cost */}
        <div className="flex justify-between items-center mt-6">
          <div className="font-bold text-black">
            Medicine cost: <span className="font-normal">{medicineCost.toLocaleString()} VND</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="border-2 border-blue-300 rounded-lg px-6 py-2 font-bold text-blue-500 bg-white">
              Total cost: {totalCost.toLocaleString()} VND
            </div>
            <button className="bg-blue-500 text-white rounded px-8 py-2 font-semibold hover:bg-blue-600">
              Finish
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MedicalExamination;