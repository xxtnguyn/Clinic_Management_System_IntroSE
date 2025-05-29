import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { patientService } from "../api/patient.service";
import { useLocation } from "react-router-dom";
import HeaderDashboard from "../components/HeaderDashboard";
import themeImage from "../assets/theme.png";

type SearchFormInputs = {
  date: string;
  name: string;
};

const MedicalExamination = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const { register, handleSubmit, reset } = useForm<SearchFormInputs>();

  const location = useLocation();

  const { user } = location.state || {};

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
    handleSubmit(onSubmit)(); // fetch all
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <img
        src={themeImage}
        alt="Theme Overlay"
        className="absolute w-full h-[8vh] object-cover z-10"
      />
      <HeaderDashboard currentUser={user} />
      <main className="container mx-auto px-8 py-6 mt-16">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-8 flex flex-wrap items-end gap-4"
        >
          <div>
            <label className="block text-sm text-[#1250B1] mb-1">
              Examination Date
            </label>
            <input
              type="date"
              {...register("date")}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div className="flex-1 max-w-md">
            <label className="block text-sm text-[#1250B1] mb-1">
              Full Name
            </label>
            <input
              type="text"
              {...register("name")}
              placeholder="Search..."
              className="w-full border border-gray-300 rounded px-3 py-2"
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
                    <td className="px-6 py-4">{patient["id"]}</td>
                    <td className="px-6 py-4">{patient["Họ Tên"]}</td>
                    <td className="px-6 py-4">{patient["Ngày Khám"]}</td>
                    <td className="px-6 py-4">{patient["Loại Bệnh"]}</td>
                    <td className="px-6 py-4">{patient["Triệu Chứng"]}</td>
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

export default MedicalExamination;
