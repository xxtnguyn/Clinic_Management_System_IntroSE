import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import HeaderDashboard from "../components/HeaderDashboard";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useForm } from "react-hook-form";
import { appointmentService } from "../api/appointment.service";
import type { Appointment } from "../api/appointment.service";
import {
  formatDateForAPI,
  formatDateForDisplay,
  convertToAPIDateFormat,
} from "../utils/dateUtils";

type SearchFormInputs = {
  name: string;
  date: string;
};

type CreateAppointmentInputs = {
  patientId: number;
  appointmentDate: string;
  appointmentTime: string;
  notes: string;
};

const AppointmentList = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cancelingAppointmentId, setCancelingAppointmentId] = useState<
    number | null
  >(null);
  const [cancelReason, setCancelReason] = useState("");
  const datePickerRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, reset, setValue } =
    useForm<SearchFormInputs>();
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
  } = useForm<CreateAppointmentInputs>();
  const location = useLocation();
  const { user } = location.state || {};

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

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const result = await appointmentService.getAppointments({});
      setAppointments(result);
    } catch (err: any) {
      const message = err?.message || "Failed to fetch appointments";
      setError(message);
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      setValue("date", formatDateForAPI(date));
    } else {
      setValue("date", "");
    }
    setShowDatePicker(false);
  };

  const onSubmit = async (data: SearchFormInputs) => {
    try {
      setLoading(true);
      setError("");

      const safeName = (data.name ?? "").trim();
      const safeDate = data.date || "";

      const apiResult = await appointmentService.getAppointments({
        name: safeName,
        date: safeDate,
      });

      const filtered = apiResult.filter((appointment) => {
        const normalizedDate = convertToAPIDateFormat(appointment.date);
        const matchDate = safeDate ? normalizedDate === safeDate : true;
        const matchName = safeName
          ? appointment.patientName
              .toLowerCase()
              .includes(safeName.toLowerCase())
          : true;
        return matchDate && matchName;
      });

      setAppointments(filtered);
    } catch (err: any) {
      const message = err?.message || "Unexpected error";
      setError(message);
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const onCreateAppointment = async (data: CreateAppointmentInputs) => {
    try {
      setLoading(true);
      setError("");
      await appointmentService.createAppointment(data);
      setShowCreateModal(false);
      resetCreate();
      await fetchAppointments();
    } catch (err: any) {
      const message = err?.message || "Failed to create appointment";
      setError(message);
      console.error("Create failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const onCancelAppointment = async (id: number) => {
    if (!cancelReason.trim()) {
      setError("Please provide a reason for cancellation");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await appointmentService.cancelAppointment(id, cancelReason);
      setCancelingAppointmentId(null);
      setCancelReason("");
      await fetchAppointments();
    } catch (err: any) {
      const message = err?.message || "Failed to cancel appointment";
      setError(message);
      console.error("Cancel failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const onClear = () => {
    reset();
    setSelectedDate(null);
    fetchAppointments();
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 relative">
      <div className="fixed inset-0 bg-gray-50 -z-10"></div>
      <HeaderDashboard currentUser={user} />
      <main className="container mx-auto px-8 py-6 mt-16">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Appointment List</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#1250B1] text-white px-4 py-2 rounded hover:bg-opacity-90"
          >
            Create Appointment
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-8 flex flex-wrap items-end gap-4"
        >
          <div>
            <label className="block text-sm text-black mb-1">
              Appointment Date
            </label>
            <div
              className="flex items-center gap-2 relative"
              ref={datePickerRef}
            >
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
              Patient Name
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
              Search
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

        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <table className="w-full">
            <thead className="bg-[#1250B1] text-white">
              <tr>
                <th className="px-6 py-3 text-left">No.</th>
                <th className="px-6 py-3 text-left">Full Name</th>
                <th className="px-6 py-3 text-left">Gender</th>
                <th className="px-6 py-3 text-left">Year of Birth</th>
                <th className="px-6 py-3 text-left">Address</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-red-500">
                    {error}
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    No appointments found
                  </td>
                </tr>
              ) : (
                appointments.map((appointment, index) => (
                  <tr
                    key={appointment.id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-black">{index + 1}</td>
                    <td className="px-6 py-4 text-black">
                      {appointment.patientName}
                    </td>
                    <td className="px-6 py-4 text-black">
                      {appointment.gender}
                    </td>
                    <td className="px-6 py-4 text-black">
                      {appointment.yearOfBirth}
                    </td>
                    <td className="px-6 py-4 text-black">
                      {appointment.address}
                    </td>
                    <td className="px-6 py-4 text-black">
                      {formatDateForDisplay(appointment.date)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-sm ${
                          appointment.status === "cancelled"
                            ? "bg-red-100 text-red-600"
                            : appointment.status === "completed"
                            ? "bg-green-100 text-green-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {appointment.status === "scheduled" && (
                        <button
                          onClick={() =>
                            setCancelingAppointmentId(appointment.id)
                          }
                          className="text-red-600 hover:text-red-800"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Create Appointment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Appointment</h2>
            <form onSubmit={handleSubmitCreate(onCreateAppointment)}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient ID
                </label>
                <input
                  type="number"
                  {...registerCreate("patientId", { required: true })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Appointment Date
                </label>
                <input
                  type="date"
                  {...registerCreate("appointmentDate", { required: true })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Appointment Time
                </label>
                <input
                  type="time"
                  {...registerCreate("appointmentTime", { required: true })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  {...registerCreate("notes")}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreate();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1250B1] text-white rounded hover:bg-opacity-90"
                  disabled={loading}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {cancelingAppointmentId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Cancel Appointment</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Cancellation
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows={3}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setCancelingAppointmentId(null);
                  setCancelReason("");
                }}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => onCancelAppointment(cancelingAppointmentId)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={loading}
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
