import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import HeaderDashboard from "../components/HeaderDashboard";
import { appointmentService } from "../api/appointment.service";
import type { Appointment } from "../api/appointment.service";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import searchIcon from "../assets/search.png";
import {
  formatDateForAPI,
  formatDateTimeForDisplay,
  formatDateTimetoAPIFormat,
} from "../utils/dateUtils";
import { useForm } from "react-hook-form";
import PatientSelectionModal from "../components/PatientSelectionModal";
import { patientService } from "../api/patient.service";
import type { Patient } from "../api/patient.service";
import { SearchBar } from "../components/SearchBar";
import type { SearchBarValues } from "../components/SearchBar";

type SearchFormInputs = {
  date: string;
  name: string;
  status: string;
};

const AppointmentList = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsRaw, setAppointmentsRaw] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, reset, setValue, watch } =
    useForm<SearchFormInputs>();
  const location = useLocation();
  const { user } = location.state || {};
  const selectedStatus = watch("status");
  const [editMode, setEditMode] = useState(false);
  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [createMode, setCreateMode] = useState(false);
  const [showPatientList, setShowPatientList] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [patientError, setPatientError] = useState("");

  const formRef = useRef<HTMLDivElement>(null);

  // State cho form edit (có thể là object chứa các field muốn sửa)
  const [editForm, setEditForm] = useState({
    patient_name: "",
    gender: "",
    address: "",
    birth_year: "",
    appointment_date: "",
    appointment_time: "",
    status: "",
    phone: "",
    notes: "",
  });

  const initialFormState = {
    patient_name: "",
    gender: "Nam",
    address: "",
    birth_year: "2000",
    appointment_date: new Date().toISOString(),
    appointment_time: "07:00:00",
    status: "waiting",
    phone: "",
    notes: "",
  };

  const [searchValues, setSearchValues] = useState<SearchBarValues>({
    date: "",
    name: "",
    status: "",
  });

  // State để lưu các trường thiếu khi nhấn Create
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Helper: kiểm tra form hợp lệ cho Create
  const getMissingFields = () => {
    const fields: string[] = [];
    if (editForm.patient_name.trim() === "") fields.push("patient_name");
    if (editForm.gender.trim() === "") fields.push("gender");
    if (editForm.birth_year.trim() === "") fields.push("birth_year");
    if (editForm.phone.trim() === "") fields.push("phone");
    if (editForm.address.trim() === "") fields.push("address");
    if (!editForm.appointment_date) fields.push("appointment_date");
    if (!editForm.appointment_time) fields.push("appointment_time");
    return fields;
  };

  // Sort appointments by status priority and date
  const sortAppointments = (appointments: Appointment[]) => {
    const statusPriority = {
      in_progress: 1,
      waiting: 2,
      completed: 3,
      cancelled: 4,
    };

    return appointments.sort((a, b) => {
      // First sort by status priority
      const statusA =
        statusPriority[a.status as keyof typeof statusPriority] || 5;
      const statusB =
        statusPriority[b.status as keyof typeof statusPriority] || 5;

      if (statusA !== statusB) {
        return statusA - statusB;
      }

      // If same status, sort by appointment date (newest first)
      const dateA = new Date(a.appointment_date).getTime();
      const dateB = new Date(b.appointment_date).getTime();
      return dateB - dateA;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setShowDatePicker(false);
      }
      if (
        statusRef.current &&
        !statusRef.current.contains(event.target as Node)
      ) {
        setIsStatusOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      setValue("date", formatDateForAPI(date));
    } else {
      setValue("date", "");
    }
    setShowDatePicker(false);
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await appointmentService.getAppointments();

      const sortedResponse = sortAppointments(response);
      setAppointments(sortedResponse);
      setAppointmentsRaw(sortedResponse);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách cuộc hẹn");
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (values = searchValues) => {
    try {
      setLoading(true);
      setError("");
      console.log("[SEARCH] Truyền vào API:", {
        status: values.status,
        date: values.date,
        name: values.name,
      });
      const result = await appointmentService.getAppointments(
        values.status,
        values.date,
        values.name
      );
      console.log("[SEARCH] Danh sách trả về:");
      result.forEach((appointment) => {
        console.log({
          status: appointment.status,
          date: appointment.appointment_date,
          name: appointment.patient_name,
        });
      });
      // Filter lại ở frontend theo ngày và tên (giống PatientRecords)
      let filtered = result;
      if (values.date) {
        filtered = filtered.filter((appointment) => {
          const apptDate = new Date(appointment.appointment_date);
          const yyyy = apptDate.getFullYear();
          const mm = String(apptDate.getMonth() + 1).padStart(2, "0");
          const dd = String(apptDate.getDate()).padStart(2, "0");
          const apptDateStr = `${yyyy}-${mm}-${dd}`;
          return apptDateStr === values.date;
        });
      }
      if (values.name && values.name.trim() !== "") {
        const search = values.name.toLowerCase();
        filtered = filtered.filter((appointment) =>
          appointment.patient_name
            .toLowerCase()
            .split(" ")
            .some((word) => word.startsWith(search))
        );
      }

      filtered = sortAppointments(filtered);
      setAppointments(filtered);
    } catch (err: any) {
      const message = err?.message || "Unexpected error";
      setError(message);
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchValues({
      date: "",
      name: "",
      status: "",
    });
    setSelectedDate(null);
    fetchAppointments();
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if ((createMode || (editMode && selectedAppointment)) && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [createMode, editMode, selectedAppointment]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "bg-blue-100 text-blue-600";
      case "in_progress":
        return "bg-yellow-100 text-yellow-600";
      case "completed":
        return "bg-green-100 text-green-600";
      case "cancelled":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Add status options
  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "waiting", label: "Waiting" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    // { value: "no_show", label: "No Show" },
  ];

  useEffect(() => {
    const fetchPatients = async () => {
      if (!isPatientModalOpen) return;

      // console.log("Opening modal. Fetching patients...");
      try {
        setIsLoadingPatients(true);
        setPatientError("");
        const data = await patientService.getAllPatients();
        setPatients(data);
        console.log("Set patients in AppointmentList:", data);
      } catch (error: any) {
        const message = error?.message || "Failed to fetch patients";
        setPatientError(message);
        console.error("Error fetching patients:", error);
      } finally {
        setIsLoadingPatients(false);
      }
    };

    fetchPatients();
  }, [isPatientModalOpen]);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setEditForm({
      ...editForm,
      patient_name: patient.full_name,
      gender: patient.gender,
      birth_year: patient.birth_year.toString(),
      phone: patient.phone,
      address: patient.address,
    });
  };

  // Thêm useEffect search động
  useEffect(() => {
    handleSearch(searchValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValues]);

  // 1. Helper for time comparison
  const getTimeOptions = (selectedDate: Date | null) => {
    const allTimes = [
      "07:00",
      "07:15",
      "07:30",
      "07:45",
      "08:00",
      "08:15",
      "08:30",
      "08:45",
      "09:00",
      "09:15",
      "09:30",
      "09:45",
      "10:00",
      "10:15",
      "10:30",
      "10:45",
      "11:00",
      "11:15",
      "11:30",
      "11:45",
      "12:00",
      "12:15",
      "12:30",
      "12:45",
      "13:00",
      "13:15",
      "13:30",
      "13:45",
      "14:00",
      "14:15",
      "14:30",
      "14:45",
      "15:00",
      "15:15",
      "15:30",
      "15:45",
      "16:00",
      "16:15",
      "16:30",
      "16:45",
      "17:00",
      "17:15",
      "17:30",
      "17:45",
      "18:00",
    ];
    if (!selectedDate) return allTimes;
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    if (!isToday) return allTimes;
    // Only show times greater than now
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return allTimes.filter((timeStr) => {
      const [h, m] = timeStr.split(":").map(Number);
      const minutes = h * 60 + m;
      return minutes > currentMinutes;
    });
  };

  // Tạo biến kiểm tra disabled
  const isEditLocked =
    !!selectedAppointment &&
    (selectedAppointment.status === "completed" ||
      selectedAppointment.status === "cancelled");

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <HeaderDashboard currentUser={user} />
      <main className="container mx-auto px-8 py-6 mt-16">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Appointment List</h1>
        </div>

        {/* Replace old search form with new SearchBar component */}
        <SearchBar
          values={searchValues}
          selectedDate={selectedDate}
          onDateChange={(date) => {
            setSelectedDate(date);
            const newDate = date ? formatDateForAPI(date) : "";
            setSearchValues((prev) => ({ ...prev, date: newDate }));
          }}
          onNameChange={(value) => {
            setSearchValues((prev) => ({ ...prev, name: value }));
          }}
          onStatusChange={(value) => {
            setSearchValues((prev) => ({ ...prev, status: value }));
          }}
          onSearch={() => handleSearch(searchValues)}
          onClear={handleClear}
        />

        {editMode && (
          <p className="text-blue-600 font-semibold text-lg mt-4 mb-2">
            Chọn một cuộc hẹn trong bảng bên dưới
          </p>
        )}

        {/* Appointments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-[#1250B1] text-white sticky top-0 z-0">
                <tr>
                  <th className="px-3 py-3 text-center">No.</th>
                  <th className="px-3 py-3 text-center">Patient Name</th>
                  <th className="px-3 py-3 text-center">Gender</th>
                  <th className="px-3 py-3 text-center">Address</th>
                  <th className="px-3 py-3 text-center">Appointment Date</th>
                  <th className="px-3 py-3 text-center">Time</th>
                  <th className="px-3 py-3 text-center">Notes</th>
                  <th className="px-3 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      Đang tải...
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
                    <td colSpan={8} className="text-center py-4 text-black">
                      Không có cuộc hẹn nào
                    </td>
                  </tr>
                ) : (
                  appointments.map((appointment, index) => (
                    <tr
                      key={appointment.id}
                      className={`border-b transition-colors duration-150 cursor-pointer ${
                        selectedAppointment?.id === appointment.id
                          ? "bg-blue-200"
                          : editMode && hoveredRowId === appointment.id
                          ? "bg-gray-200"
                          : "hover:bg-gray-50"
                      }`}
                      onMouseEnter={() =>
                        editMode && setHoveredRowId(appointment.id)
                      }
                      onMouseLeave={() => editMode && setHoveredRowId(null)}
                      onClick={() => {
                        if (editMode) {
                          setSelectedAppointment(appointment);
                          setEditForm({
                            patient_name: appointment.patient_name,
                            gender: appointment.gender,
                            address: appointment.address,
                            birth_year: appointment.birth_year.toString(),
                            appointment_date: appointment.appointment_date,
                            appointment_time: appointment.appointment_time,
                            status: appointment.status,
                            phone: appointment.phone,
                            notes: appointment.notes,
                          });
                        }
                      }}
                    >
                      <td className="px-6 py-4 text-black">{index + 1}</td>
                      <td className="px-3 py-4 text-black">
                        {appointment.patient_name}
                      </td>
                      <td className="px-6 py-4 text-black">
                        {appointment.gender}
                      </td>
                      <td className="px-6 py-4 text-black">
                        {appointment.address}
                      </td>
                      <td className="px-4 py-4 text-black">
                        {formatDateTimeForDisplay(appointment.appointment_date)}
                      </td>
                      <td className="px-2 py-4 text-black">
                        {appointment.appointment_time}
                      </td>
                      <td className="px-6 py-4 text-black">
                        {appointment.notes}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-sm ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          {formatStatus(appointment.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between mt-4">
          {/* Nút Create bên trái */}
          <div>
            <button
              className={`${
                createMode ? "bg-gray-500" : "bg-blue-500"
              } text-white px-6 py-2 rounded hover:bg-blue-700`}
              onClick={() => {
                if (createMode) {
                  setCreateMode(false);
                  setEditForm(initialFormState);
                  setSelectedAppointment(null);
                  setMissingFields([]);
                } else {
                  setCreateMode(true);
                  setEditMode(false);
                  setSelectedAppointment(null);
                  setEditForm(initialFormState);
                  setTimeout(() => {
                    formRef.current?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }
              }}
              disabled={editMode}
            >
              {createMode ? "Cancel Creating" : "Create"}
            </button>
          </div>

          {/* Nút Edit bên phải */}
          <div>
            <button
              className={`${
                editMode ? "bg-gray-500" : "bg-[#1250B1]"
              } text-white px-6 py-2 rounded hover:bg-blue-700`}
              onClick={() => {
                if (editMode) {
                  setEditMode(false);
                  setSelectedAppointment(null);
                  setEditForm(initialFormState);
                } else {
                  setEditMode(true);
                  setCreateMode(false);
                  setSelectedAppointment(null);
                  setTimeout(() => {
                    formRef.current?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }
              }}
              disabled={createMode}
            >
              {editMode ? "Cancel Editing" : "Edit"}
            </button>
          </div>
        </div>

        {editMode && selectedAppointment && (
          <section
            ref={formRef}
            className="mt-6 p-6 bg-white rounded shadow border border-gray-200"
          >
            <h2 className="text-2xl font-bold text-blue-800 border-b-2 border-blue-300 pb-2 mb-6">
              📝 Edit Appointment
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
              <div className="space-y-6 col-span-2">
                <div>
                  <label className="block mb-1 font-medium text-gray-600">
                    Patient Information (Read-only)
                  </label>
                  <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Name:</p>
                        <p className="font-medium">
                          {selectedAppointment.patient_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Gender:</p>
                        <p className="font-medium">
                          {selectedAppointment.gender}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Year of Birth:</p>
                        <p className="font-medium">
                          {selectedAppointment.birth_year}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Address:</p>
                        <p className="font-medium">
                          {selectedAppointment.address}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone Number:</p>
                        <p className="font-medium">
                          {selectedAppointment.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bên phải: Các trường có thể chỉnh sửa */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 col-span-2">
                {/* Appointment Date */}
                <div className="relative w-40">
                  <label className="block mb-1 font-medium text-black">
                    Appointment Date
                  </label>
                  <DatePicker
                    selected={
                      editForm.appointment_date
                        ? new Date(editForm.appointment_date)
                        : null
                    }
                    onChange={(date: Date | null) => {
                      if (date) {
                        setEditForm((prev) => ({
                          ...prev,
                          appointment_date: date.toISOString(),
                          appointment_time: "", // reset time if date changes
                        }));
                        if (missingFields.includes("appointment_date")) {
                          setMissingFields((prev) =>
                            prev.filter((f) => f !== "appointment_date")
                          );
                        }
                      }
                    }}
                    dateFormat="dd/MM/yyyy"
                    className="w-full border border-gray-300 rounded-full px-4 py-2 pr-10 text-black shadow-sm bg-white"
                    placeholderText="dd/mm/yyyy"
                    minDate={new Date()}
                    disabled={isEditLocked}
                  />

                  {/* Icon mũi tên chỉ xuống giống dropdown */}
                  <div className="pointer-events-none absolute inset-y-12 right-5 flex items-center text-gray-500">
                    <svg
                      className="w-5 h-5"
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
                </div>

                {/* Appointment Time */}
                <div className="relative">
                  <label className="block mb-1 font-medium text-black">
                    Appointment Time
                  </label>
                  <select
                    className={`w-40 bg-white border ${
                      missingFields.includes("appointment_time")
                        ? "border-red-500"
                        : "border-gray-300"
                    } text-gray-700 rounded-full px-4 py-2 text-base shadow-sm appearance-none`}
                    value={editForm.appointment_time}
                    onChange={(e) => {
                      setEditForm((prev) => ({
                        ...prev,
                        appointment_time: e.target.value,
                      }));
                      if (
                        missingFields.includes("appointment_time") &&
                        e.target.value !== ""
                      ) {
                        setMissingFields((prev) =>
                          prev.filter((f) => f !== "appointment_time")
                        );
                      }
                    }}
                    disabled={isEditLocked}
                  >
                    {getTimeOptions(
                      editForm.appointment_date
                        ? new Date(editForm.appointment_date)
                        : null
                    ).map((timeShort) => {
                      const timeFull = timeShort + ":00";
                      return (
                        <option key={timeFull} value={timeFull}>
                          {timeShort}
                        </option>
                      );
                    })}
                  </select>

                  {/* Icon mũi tên chỉ xuống */}
                  <div className="pointer-events-none absolute inset-y-12 right-6 flex items-center text-gray-500">
                    <svg
                      className="w-5 h-5"
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
                </div>

                {/* Status */}
                <div className="relative w-48" ref={statusRef}>
                  <label className="block mb-1 font-medium text-black">
                    Status
                  </label>

                  {/* Input hiện trạng thái (click mở dropdown) */}
                  <div
                    className="relative"
                    onClick={() => setIsStatusOpen(!isStatusOpen)}
                  >
                    <input
                      type="text"
                      readOnly
                      value={
                        statusOptions.find(
                          (opt) => opt.value === editForm.status
                        )?.label || "Waiting"
                      }
                      className={`w-40 border ${
                        missingFields.includes("status")
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-full px-4 py-2 text-black bg-white cursor-pointer shadow-sm appearance-none pr-10`}
                      disabled={isEditLocked}
                    />

                    {/* Icon mũi tên nằm trong input, sát phải */}
                    <div className="pointer-events-none absolute inset-y-0 right-12 flex items-center text-gray-500">
                      <svg
                        className="w-5 h-5"
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
                  </div>

                  {/* Dropdown options */}
                  {isStatusOpen && (
                    <div className="absolute z-10 w-40 mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
                      {statusOptions
                        .filter((opt) => opt.value !== "")
                        .map((option) => (
                          <div
                            key={option.value}
                            className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                              editForm.status?.toLowerCase() === option.value
                                ? "bg-gray-100"
                                : ""
                            }`}
                            onClick={() => {
                              setEditForm((prev) => ({
                                ...prev,
                                status: option.value,
                              }));
                              setIsStatusOpen(false);
                              if (missingFields.includes("status")) {
                                setMissingFields((prev) =>
                                  prev.filter((f) => f !== "status")
                                );
                              }
                            }}
                          >
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-sm font-medium ${getStatusColor(
                                option.value
                              )}`}
                            >
                              {option.label}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="relative w-135 mt-4">
                  <label className="block mb-1 font-medium text-black">
                    Notes
                  </label>
                  <textarea
                    value={editForm.notes || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Enter note..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black placeholder-gray-400 resize-none"
                    rows={4}
                    disabled={isEditLocked}
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex justify-end gap-4">
              <button
                className={`bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700${
                  selectedAppointment &&
                  (selectedAppointment.status === "completed" ||
                    selectedAppointment.status === "cancelled")
                    ? " opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={() => {
                  if (!selectedAppointment) return;
                  if (
                    selectedAppointment.status === "completed" ||
                    selectedAppointment.status === "cancelled"
                  )
                    return;
                  const isStatusChanged =
                    editForm.status !== selectedAppointment.status;
                  const updatedData = {
                    appointment_date: editForm.appointment_date,
                    appointment_time: editForm.appointment_time,
                    notes: editForm.notes,
                    ...(isStatusChanged && { status: editForm.status }),
                  };
                  appointmentService
                    .updateAppointment(selectedAppointment.id, updatedData)
                    .then(() => {
                      alert("✅ The appointment has been updated successfully");
                      setEditMode(false);
                      setSelectedAppointment(null);
                      fetchAppointments();
                    })
                    .catch((err) => {
                      alert(
                        "Cập nhật cuộc hẹn thất bại: " +
                          (err?.message || err) +
                          ". Vui lòng liên hệ quản trị viên."
                      );
                    });
                }}
                disabled={
                  selectedAppointment &&
                  (selectedAppointment.status === "completed" ||
                    selectedAppointment.status === "cancelled")
                }
              >
                Save Changes
              </button>
            </div>
          </section>
        )}

        {createMode && (
          <section
            ref={formRef}
            className="mt-6 p-6 bg-white rounded shadow border border-gray-200"
          >
            {/* Title with full-width border and button positioned absolutely */}
            <div className="mb-6 relative">
              <h2 className="text-2xl font-bold text-blue-500 border-b-2 border-blue-300 pb-2">
                ➕ Create New Appointment
              </h2>

              {/* Button positioned absolutely on the same line */}
              <button
                onClick={() => setIsPatientModalOpen(true)}
                className="absolute top-[-8px] right-0 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Select Existing Patient
              </button>
            </div>

            {selectedPatient && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span className="font-medium">Selected Patient:</span>
                  <span>{selectedPatient.full_name}</span>
                  <span className="text-gray-500">|</span>
                  <span className="text-gray-600">{selectedPatient.phone}</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedPatient(null);
                    setEditForm({
                      ...editForm,
                      patient_name: "",
                      gender: "Nam",
                      birth_year: "2000",
                      phone: "",
                      address: "",
                    });
                  }}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Clear Selection
                </button>
              </div>
            )}

            {/* Existing form fields */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Bên trái: 3 input dài */}
              <div className="space-y-6 col-span-1">
                {/* Patient Name */}
                <div>
                  <label className="block mb-1 font-medium text-black">
                    Patient Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-120 border ${
                      missingFields.includes("patient_name")
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-full px-3 py-2 text-black placeholder-gray-400`}
                    value={editForm.patient_name}
                    onChange={(e) => {
                      const filtered = e.target.value.replace(
                        /[^a-zA-ZÀ-ỹ\s]/g,
                        ""
                      );
                      setEditForm((prev) => ({
                        ...prev,
                        patient_name: filtered,
                      }));
                      if (
                        missingFields.includes("patient_name") &&
                        filtered.trim() !== ""
                      ) {
                        setMissingFields((prev) =>
                          prev.filter((f) => f !== "patient_name")
                        );
                      }
                    }}
                    placeholder="Enter patient name"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block mb-1 font-medium text-black">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-120 border ${
                      missingFields.includes("address")
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-full px-3 py-2 text-black placeholder-gray-400`}
                    value={editForm.address}
                    onChange={(e) => {
                      setEditForm((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }));
                      if (
                        missingFields.includes("address") &&
                        e.target.value.trim() !== ""
                      ) {
                        setMissingFields((prev) =>
                          prev.filter((f) => f !== "address")
                        );
                      }
                    }}
                    placeholder="Enter address "
                  />
                </div>

                {/* Phone và Appointment Date cùng hàng ngang */}
                <div className="flex space-x-3">
                  {/* Phone */}
                  <div className="flex-1 min-w-[220px]">
                    <label className="block mb-1 font-medium text-black">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-50 border ${
                        missingFields.includes("phone")
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-full px-3 py-2 text-black placeholder-gray-400`}
                      value={editForm.phone}
                      onChange={(e) => {
                        const filtered = e.target.value.replace(
                          /[^0-9+()-\s]/g,
                          ""
                        );
                        setEditForm((prev) => ({
                          ...prev,
                          phone: filtered,
                        }));
                        if (
                          missingFields.includes("phone") &&
                          filtered.trim() !== ""
                        ) {
                          setMissingFields((prev) =>
                            prev.filter((f) => f !== "phone")
                          );
                        }
                      }}
                      placeholder="Enter phone number "
                    />
                  </div>

                  <div className="flex-1 min-w-[120px]">
                    <label className="block mb-1 font-medium text-black">
                      Year of Birth <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <select
                        className={`w-full border ${
                          missingFields.includes("birth_year")
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-full px-4 py-2 text-black bg-white appearance-none pr-10`}
                        value={editForm.birth_year}
                        onChange={(e) => {
                          setEditForm((prev) => ({
                            ...prev,
                            birth_year: e.target.value,
                          }));
                          if (
                            missingFields.includes("birth_year") &&
                            e.target.value !== ""
                          ) {
                            setMissingFields((prev) =>
                              prev.filter((f) => f !== "birth_year")
                            );
                          }
                        }}
                      >
                        <option value="">Select Year</option>
                        {[...Array(45)].map((_, i) => {
                          const year = 1980 + i;
                          return (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          );
                        })}
                      </select>

                      {/* Icon mũi tên thả xuống nằm bên phải input */}
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                        <svg
                          className="w-5 h-5"
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
                    </div>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <label className="block mb-1 font-medium text-black">
                      Gender <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <select
                        className={`w-30 border ${
                          missingFields.includes("gender")
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-full px-4 py-2 text-black bg-white appearance-none pr-10`}
                        value={editForm.gender}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val !== "") {
                            setEditForm((prev) => ({
                              ...prev,
                              gender: val,
                            }));
                            if (missingFields.includes("gender")) {
                              setMissingFields((prev) =>
                                prev.filter((f) => f !== "gender")
                              );
                            }
                          }
                        }}
                      >
                        <option value="Nam" className="text-blue-700">
                          Nam
                        </option>
                        <option value="Nữ" className="text-pink-600">
                          Nữ
                        </option>
                        <option value="Khác" className="text-purple-600">
                          Khác
                        </option>
                      </select>

                      {/* Icon mũi tên dropdown */}
                      <div className="pointer-events-none absolute inset-y-0 right-24 flex items-center text-gray-500">
                        <svg
                          className="w-5 h-5"
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
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-[220px]">
                  <label className="block mb-1 font-medium text-black">
                    Notes
                  </label>
                  <textarea
                    className="w-290 border border-gray-300 rounded-lg px-3 py-2 text-black placeholder-gray-400 resize-none"
                    value={editForm.notes}
                    onChange={(e) => {
                      setEditForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }));
                    }}
                    placeholder="Enter notes"
                    rows={4} // Chiều cao mặc định của ô note
                  />
                </div>
              </div>

              {/* Bên phải: 2 cột */}
              <div className="flex gap-16 col-span-2 col-start-3">
                {/* Cột 1: Year of Birth, Gender, Appointment Time */}
                <div className="space-y-6">
                  {/* Appointment Date */}
                  <div className="relative w-full max-w-xs">
                    <label className="block mb-1 font-medium text-black">
                      Appointment Date <span className="text-red-500">*</span>
                    </label>

                    <DatePicker
                      selected={
                        editForm.appointment_date
                          ? new Date(editForm.appointment_date)
                          : null
                      }
                      onChange={(date: Date | null) => {
                        if (date) {
                          setEditForm((prev) => ({
                            ...prev,
                            appointment_date: date.toISOString(),
                          }));
                          if (missingFields.includes("appointment_date")) {
                            setMissingFields((prev) =>
                              prev.filter((f) => f !== "appointment_date")
                            );
                          }
                        }
                      }}
                      dateFormat="dd/MM/yyyy"
                      className={`w-40 border ${
                        missingFields.includes("appointment_date")
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-full px-4 py-2 pr-10 text-black bg-white appearance-none`}
                      placeholderText="dd/mm/yyyy"
                      minDate={new Date()}
                      disabled={isEditLocked}
                    />

                    {/* Icon mũi tên dropdown */}
                    <div className="pointer-events-none absolute inset-y-12 right-5 flex items-center text-gray-500">
                      <svg
                        className="w-5 h-5"
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
                  </div>

                  <div className="relative w-full max-w-xs">
                    <label className="block mb-1 font-medium text-black">
                      Appointment Time <span className="text-red-500">*</span>
                    </label>

                    <select
                      className={`w-30 border ${
                        missingFields.includes("appointment_time")
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-full px-4 py-2 text-black bg-white appearance-none pr-10`}
                      value={editForm.appointment_time}
                      onChange={(e) => {
                        setEditForm((prev) => ({
                          ...prev,
                          appointment_time: e.target.value,
                        }));
                        if (
                          missingFields.includes("appointment_time") &&
                          e.target.value !== ""
                        ) {
                          setMissingFields((prev) =>
                            prev.filter((f) => f !== "appointment_time")
                          );
                        }
                      }}
                      disabled={isEditLocked}
                    >
                      {/* <option value="">Select Time</option> */}
                      {getTimeOptions(
                        editForm.appointment_date
                          ? new Date(editForm.appointment_date)
                          : null
                      ).map((timeShort) => {
                        const timeFull = timeShort + ":00";
                        return (
                          <option key={timeFull} value={timeFull}>
                            {timeShort}
                          </option>
                        );
                      })}
                    </select>

                    {/* Icon mũi tên dropdown */}
                    <div className="pointer-events-none absolute inset-y-12 right-14 flex items-center text-gray-500">
                      <svg
                        className="w-5 h-5"
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
                  </div>
                </div>

                {/* Cột 2: Status (text) */}
                <div className="space-y-6">
                  <div>
                    <label className="block mb-1 font-medium text-black">
                      Status
                    </label>
                    <div
                      className={`w-30 rounded-full px-3 py-2 font-medium select-none text-center ${getStatusColor(
                        editForm.status || "waiting"
                      )}`}
                    >
                      {(editForm.status || "waiting")
                        .split("_")
                        .map(
                          (word) => word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" ")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex justify-end gap-4">
              <button
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-700"
                onClick={() => {
                  const missing = getMissingFields();
                  setMissingFields(missing);
                  if (missing.length > 0) return;
                  console.log(">>> Button clicked");
                  if (selectedPatient) {
                    // Đã chọn bệnh nhân → chỉ tạo cuộc hẹn
                    console.log("Selected form:", editForm);
                    const newAppointment = {
                      patient_id: selectedPatient.id,
                      appointment_date: editForm.appointment_date.substring(
                        0,
                        10
                      ),
                      appointment_time: editForm.appointment_time,
                      notes: editForm.notes,
                    };

                    console.log("New appointment:", newAppointment);

                    appointmentService
                      .createAppointment(newAppointment)
                      .then(() => {
                        alert("Appointment created successfully");
                        setCreateMode(false);
                        setSelectedPatient(null);
                        setEditForm(initialFormState);
                        fetchAppointments();
                      })
                      .catch((err) => {
                        alert(
                          "Failed to create appointment: " +
                            (err?.message || err)
                        );
                      });
                  } else {
                    // Chưa chọn bệnh nhân → tạo bệnh nhân mới trước
                    const newPatient = {
                      full_name: editForm.patient_name,
                      gender: editForm.gender,
                      birth_year: Number(editForm.birth_year),
                      phone: editForm.phone,
                      address: editForm.address,
                    };

                    console.log("New patient:", newPatient);

                    patientService
                      .createPatient(newPatient)
                      .then((createdPatient) => {
                        const newAppointment = {
                          patient_id: createdPatient.id,
                          appointment_date: editForm.appointment_date.substring(
                            0,
                            10
                          ),
                          appointment_time: editForm.appointment_time,
                          // status: editForm.status,
                          notes: editForm.notes,
                        };

                        return appointmentService.createAppointment(
                          newAppointment
                        );
                      })
                      .then(() => {
                        alert("Patient and Appointment created successfully");
                        setCreateMode(false);
                        setEditForm(initialFormState);
                        fetchAppointments();
                      })
                      .catch((err) => {
                        alert(
                          "Failed to create patient/appointment: " +
                            (err?.message || err)
                        );
                      });
                  }
                }}
              >
                Create
              </button>
            </div>

            {/* Patient Selection Modal */}
            {/* console.log("Patients before modal:", patients) */}
            <PatientSelectionModal
              isOpen={isPatientModalOpen}
              onClose={() => setIsPatientModalOpen(false)}
              onSelectPatient={handlePatientSelect}
              patients={patients}
              isLoading={isLoadingPatients}
              error={patientError}
            />
          </section>
        )}
      </main>
    </div>
  );
};

export default AppointmentList;
