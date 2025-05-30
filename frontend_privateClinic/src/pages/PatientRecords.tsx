import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { patientService } from "../api/patient.service";
import { useLocation } from "react-router-dom";
import HeaderDashboard from "../components/HeaderDashboard";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type SearchFormInputs = {
  date: string;
  name: string;
};

const PatientRecord = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, reset, setValue } =
    useForm<SearchFormInputs>();

  const location = useLocation();
  const { user } = location.state || {};

  // Close datepicker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Format date as dd/mm/yyyy
  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      setValue("date", formatDate(date));
    } else {
      setValue("date", "");
    }
    setShowDatePicker(false);
  };

  const onSubmit = async (data: SearchFormInputs) => {
    try {
      setLoading(true);
      setError("");
      const result = await patientService.getPatientsExaminationHistory(
        typeof data.name === "string" ? data.name.trim() : "",
        data.date || ""
      );

      setPatients(result);
    } catch (err: any) {
      const message = err?.message || "Unexpected error";
      setError(message);
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSubmit(onSubmit)(); // gọi luôn logic của form submit để fetch full list
  }, []);

  const onClear = () => {
    reset(); // clear form
    setSelectedDate(null); // clear selected date
    handleSubmit(onSubmit)(); // fetch all
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <HeaderDashboard currentUser={user} />
      <main className="container mx-auto px-8 py-6 mt-16">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-8 flex flex-wrap items-end gap-4"
        >
          <div>
            <label className="block text-sm text-black mb-1">
              Examination Date
            </label>
            <div
              className="flex items-center gap-2 relative"
              ref={datePickerRef}
            >
              <input
                type="text"
                placeholder="mm"
                readOnly
                value={
                  selectedDate
                    ? (selectedDate.getMonth() + 1).toString().padStart(2, "0")
                    : ""
                }
                className="w-16 border border-gray-300 rounded px-3 py-2 text-black placeholder-gray-400 cursor-pointer"
                onClick={() => setShowDatePicker(true)}
              />
              <span className="text-gray-400">/</span>
              <input
                type="text"
                placeholder="dd"
                readOnly
                value={
                  selectedDate
                    ? selectedDate.getDate().toString().padStart(2, "0")
                    : ""
                }
                className="w-16 border border-gray-300 rounded px-3 py-2 text-black placeholder-gray-400 cursor-pointer"
                onClick={() => setShowDatePicker(true)}
              />
              <span className="text-gray-400">/</span>
              <input
                type="text"
                placeholder="yyyy"
                readOnly
                value={
                  selectedDate ? selectedDate.getFullYear().toString() : ""
                }
                className="w-24 border border-gray-300 rounded px-3 py-2 text-black placeholder-gray-400 cursor-pointer"
                onClick={() => setShowDatePicker(true)}
              />
              <input type="hidden" {...register("date")} />
              {showDatePicker && (
                <div className="absolute top-full left-0 z-10 mt-1">
                  <DatePicker
                    selected={selectedDate}
                    onChange={handleDateChange}
                    dateFormat="MM/dd/yyyy"
                    inline
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 max-w-md">
            <label className="block text-sm text-[#1250B1] mb-1">
              Full Name
            </label>
            <input
              type="text"
              {...register("name")}
              placeholder="Search..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-black placeholder-gray-400"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-[#1250B1] text-white px-6 py-2 rounded hover:bg-opacity-90 cursor-pointer"
            >
              Find
            </button>
            <button
              type="button"
              onClick={onClear}
              className="border border-[#1250B1] text-[#1250B1] px-6 py-2 rounded hover:bg-[#f0f6ff] cursor-pointer"
            >
              Clear
            </button>
          </div>
        </form>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#1250B1] text-white">
              <tr>
                <th className="px-6 py-3 text-left">No.</th>
                <th className="px-6 py-3 text-left">Full Name</th>
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
                patients.map((patient) => (
                  <tr key={patient["id"]} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-black">{patient["id"]}</td>
                    <td className="px-6 py-4 text-black">
                      {patient["Họ Tên"]}
                    </td>
                    <td className="px-6 py-4 text-black">
                      {patient["Ngày Khám"]}
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
