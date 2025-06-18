import { useEffect, useState } from "react";
import { patientService } from "../api/patient.service";
import type { PatientExaminationHistory } from "../api/patient.service";
import { useLocation } from "react-router-dom";
import HeaderDashboard from "../components/HeaderDashboard";
import { DateSearchInput, PatientSearchInput } from "../components/SearchBar";
import {
  formatDateForAPI,
  convertToAPIDateFormat,
  formatDateForDisplay,
} from "../utils/dateUtils";

interface SearchValues {
  date: string;
  name: string;
}

const PatientRecord = () => {
  const [patients, setPatients] = useState<PatientExaminationHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchValues, setSearchValues] = useState<SearchValues>({
    date: "",
    name: "",
  });

  const location = useLocation();
  const { user } = location.state || {};

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const result = await patientService.getPatientsExaminationHistory();
      setPatients(result);
    } catch (err: any) {
      const message = err?.message || "Failed to fetch patients";
      setError(message);
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await patientService.getPatientsExaminationHistory(
        searchValues.name,
        searchValues.date
      );

      // Filter results to match both name and date if provided
      const filtered = result.filter((patient: PatientExaminationHistory) => {
        const normalizedDate = convertToAPIDateFormat(patient["Ngày Khám"]);
        const matchDate = searchValues.date
          ? normalizedDate === searchValues.date
          : true;
        const matchName = searchValues.name
          ? patient["Họ Tên"]
              .toLowerCase()
              .includes(searchValues.name.toLowerCase())
          : true;
        return matchDate && matchName;
      });

      setPatients(filtered);
    } catch (err: any) {
      const message = err?.message || "Unexpected error";
      setError(message);
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleClear = () => {
    setSearchValues({
      date: "",
      name: "",
    });
    setSelectedDate(null);
    fetchPatients();
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <HeaderDashboard currentUser={user} />
      <main className="container mx-auto px-8 py-6 mt-16">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Patient Records</h1>
        </div>

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
              onClick={handleSearch}
              className="bg-[#1250B1] text-white px-6 py-2 rounded hover:bg-opacity-90 cursor-pointer"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="border border-[#1250B1] text-[#1250B1] px-6 py-2 rounded hover:bg-[#f0f6ff] cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-[#1250B1] text-white sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left">No.</th>
                <th className="px-6 py-3 text-left">Patient Name</th>
                <th className="px-6 py-3 text-left">Visit Date</th>
                <th className="px-6 py-3 text-left">Diagnose</th>
                <th className="px-6 py-3 text-left">Symptoms</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-red-500">
                    {error}
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    No patients found
                  </td>
                </tr>
              ) : (
                patients.map((patient, index) => (
                  <tr key={patient["id"]} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-black">{index + 1}</td>
                    <td className="px-6 py-4 text-black">
                      {patient["Họ Tên"]}
                    </td>
                    <td className="px-6 py-4 text-black">
                      {formatDateForDisplay(patient["Ngày Khám"])}
                    </td>
                    <td className="px-6 py-4 text-black">
                      {patient["Loại Bệnh"]}
                    </td>
                    <td className="px-6 py-4 text-black">
                      {patient["Triệu Chứng"]}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default PatientRecord;
