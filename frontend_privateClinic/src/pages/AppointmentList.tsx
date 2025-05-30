import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import HeaderDashboard from "../components/HeaderDashboard";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useForm } from "react-hook-form";
import { appointmentService } from "../api/appointment.service";
import type { Appointment } from "../api/appointment.service";

type SearchFormInputs = {
  name: string;
  status: string;
  date: string;
};

const AppointmentList = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, reset, setValue, watch } =
    useForm<SearchFormInputs>();
  const location = useLocation();
  const { user } = location.state || {};
  const selectedStatus = watch("status");

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusRef.current &&
        !statusRef.current.contains(event.target as Node)
      ) {
        setIsStatusOpen(false);
      }
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
      const result = await appointmentService.getAppointments({
        name: data.name,
        status: data.status,
        date: data.date,
      });
      setAppointments(result);
    } catch (err: any) {
      const message = err?.message || "Unexpected error";
      setError(message);
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const onClear = () => {
    reset();
    setSelectedDate(null);
    handleSubmit(onSubmit)();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "text-blue-600 bg-blue-100";
      case "completed":
        return "text-green-600 bg-green-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusLabel = (status: string) => {
    if (!status) return "All Status";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "scheduled", label: "Scheduled" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

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

          <div className="w-48" ref={statusRef}>
            <label className="block text-sm text-[#1250B1] mb-1">Status</label>
            <div className="relative">
              <input type="hidden" {...register("status")} />
              <button
                type="button"
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-black bg-white flex items-center justify-between"
              >
                <span
                  className={
                    selectedStatus
                      ? getStatusColor(selectedStatus) +
                        " px-2 py-0.5 rounded-full text-sm"
                      : "text-gray-700"
                  }
                >
                  {selectedStatus
                    ? statusOptions.find((opt) => opt.value === selectedStatus)
                        ?.label || ""
                    : "All Status"}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    isStatusOpen ? "transform rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isStatusOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  <div className="py-1 max-h-60 overflow-auto">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center ${
                          selectedStatus === option.value ? "bg-gray-50" : ""
                        }`}
                        onClick={() => {
                          setValue("status", option.value);
                          setIsStatusOpen(false);
                        }}
                      >
                        <span
                          className={`flex-grow ${
                            option.value
                              ? getStatusColor(option.value) +
                                " px-2 py-0.5 rounded-full text-sm"
                              : "text-gray-700"
                          }`}
                        >
                          {option.label}
                        </span>
                        {selectedStatus === option.value && (
                          <svg
                            className="w-5 h-5 text-[#1250B1]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
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

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#1250B1] text-white">
              <tr>
                <th className="px-6 py-3 text-left">No.</th>
                <th className="px-6 py-3 text-left">Patient Name</th>
                <th className="px-6 py-3 text-left">Gender</th>
                <th className="px-6 py-3 text-left">Year of Birth</th>
                <th className="px-6 py-3 text-left">Address</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Time</th>
                <th className="px-6 py-3 text-left">Status</th>
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
                appointments.map((appointment) => (
                  <tr
                    key={appointment.id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-black">{appointment.id}</td>
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
                    <td className="px-6 py-4 text-black">{appointment.date}</td>
                    <td className="px-6 py-4 text-black">{appointment.time}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {appointment.status.charAt(0).toUpperCase() +
                          appointment.status.slice(1)}
                      </span>
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

export default AppointmentList;
