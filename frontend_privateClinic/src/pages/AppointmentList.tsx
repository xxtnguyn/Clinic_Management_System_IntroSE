import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import HeaderDashboard from "../components/HeaderDashboard";
import { appointmentService } from "../api/appointment.service";
import type { Appointment, PaginationData } from "../api/appointment.service";
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
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
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
    useState<Appointment | null>(null); // appointment được chọn để edit
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
      const response = await appointmentService.getAppointments(
        "",
        "",
        "",
        pagination.page
      );
      setAppointments(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || "Failed to fetch appointments");
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await appointmentService.getAppointments(
        searchValues.status,
        searchValues.date,
        searchValues.name
      );

      const filtered = result.data.filter((appointment: Appointment) => {
        const normalizedDate = formatDateTimetoAPIFormat(
          appointment.appointment_date
        );
        const matchDate = searchValues.date
          ? normalizedDate === searchValues.date
          : true;
        const matchName = searchValues.name
          ? appointment.patient_name
              .toLowerCase()
              .split(" ")
              .some((word) => word.startsWith(searchValues.name.toLowerCase()))
          : true;
        const matchStatus = searchValues.status
          ? appointment.status === searchValues.status
          : true;

        return matchDate && matchName && matchStatus;
      });

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
  }, [pagination.page]);

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
        const data = await patientService.getAllPatients(); // Đúng tên hàm
        // console.log("Fetched patients:", data);
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

  // Thêm hàm lọc bệnh nhân theo tên
  // const filteredPatients = patients.filter((patient) =>
  //   patient.full_name?.toLowerCase().includes(patientSearch.toLowerCase())
  // );

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

  // Generate array of page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const { page, totalPages } = pagination;

    if (totalPages <= 5) {
      // If total pages is 5 or less, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);

      // Calculate start and end of page range
      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);

      // Add ellipsis if needed
      if (start > 2) {
        pageNumbers.push("...");
      }

      // Add pages in range
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pageNumbers.push("...");
      }

      // Always show last page
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

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
          onNameChange={(value) => {
            setSearchValues((prev) => ({
              ...prev,
              name: value,
            }));
          }}
          onStatusChange={(value) => {
            setSearchValues((prev) => ({
              ...prev,
              status: value,
            }));
          }}
          onSearch={handleSearch}
          onClear={handleClear}
        />

        {/* Appointments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-[#1250B1] text-white">
                <tr>
                  <th className="px-3 py-3 text-center">No.</th>
                  <th className="px-3 py-3 text-center">Patient Name</th>
                  <th className="px-3 py-3 text-center">Gender</th>
                  <th className="px-3 py-3 text-center">Address</th>
                  {/* <th className="px-6 py-3 text-left">Year of Birth</th> */}
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
                    <td colSpan={8} className="text-center py-4 text-black">
                      No appointments found
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
                      <td className="px-6 py-4 text-black">
                        {appointment.patient_name}
                      </td>
                      <td className="px-6 py-4 text-black">
                        {appointment.gender}
                      </td>
                      <td className="px-6 py-4 text-black">
                        {appointment.address}
                      </td>
                      {/* <td className="px-6 py-4 text-black">
                      {appointment.birth_year}
                    </td> */}
                      <td className="px-6 py-4 text-black">
                        {formatDateTimeForDisplay(appointment.appointment_date)}
                      </td>
                      <td className="px-6 py-4 text-black">
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
            {/* <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-red-500"
                    >
                      {error}
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No appointments found
                    </td>
                  </tr>
                ) : (
                  appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {appointment.patient_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDateTimeForDisplay(appointment.appointment_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {appointment.appointment_time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          {appointment.status.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table> */}
          </div>

          {/* Pagination */}
          {!loading && !error && appointments.length > 0 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between items-center">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md
                    ${
                      pagination.page === 1
                        ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                        : "text-gray-700 bg-white hover:bg-gray-50"
                    }`}
                >
                  Previous
                </button>

                <div className="flex items-center space-x-2">
                  {getPageNumbers().map((pageNum, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        typeof pageNum === "number" && handlePageChange(pageNum)
                      }
                      disabled={pageNum === "..."}
                      className={`px-4 py-2 text-sm font-medium rounded-md
                        ${
                          typeof pageNum === "number"
                            ? pageNum === pagination.page
                              ? "bg-blue-500 text-white"
                              : "text-gray-700 hover:bg-gray-50"
                            : "text-gray-700"
                        }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md
                    ${
                      pagination.page === pagination.totalPages
                        ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                        : "text-gray-700 bg-white hover:bg-gray-50"
                    }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end mt-4 gap-4">
          {/* Nút Edit hoặc Cancel */}
          <button
            className={`${
              editMode ? "bg-gray-500" : "bg-[#1250B1]"
            } text-white px-6 py-2 rounded hover:bg-opacity-90`}
            onClick={() => {
              if (editMode) {
                // Nếu đang trong edit mode => chuyển về bình thường
                setEditMode(false);
                setSelectedAppointment(null);
                setEditForm(initialFormState); // reset form nếu cần
              } else {
                // Vào edit mode
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

          {/* Nút Create */}
          <button
            className={`${
              createMode ? "bg-gray-500" : "bg-green-600"
            } text-white px-6 py-2 rounded hover:bg-opacity-90`}
            onClick={() => {
              if (createMode) {
                // Đang ở chế độ tạo → huỷ tạo
                setCreateMode(false);
                setEditForm(initialFormState);
                setSelectedAppointment(null);
              } else {
                // Bật chế độ tạo mới
                setCreateMode(true);
                setEditMode(false);
                setSelectedAppointment(null);
                setEditForm(initialFormState);
                setTimeout(() => {
                  formRef.current?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }
            }}
            disabled={editMode} // nếu đang Edit thì không được tạo
          >
            {createMode ? "Cancel Creating" : "Create"}
          </button>
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
              {/* Bên trái: Thông tin bệnh nhân - Read only */}
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
                        }));
                      }
                    }}
                    dateFormat="dd/MM/yyyy"
                    className="w-full border border-gray-300 rounded-full px-4 py-2 pr-10 text-black shadow-sm bg-white"
                    placeholderText="dd/mm/yyyy"
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
                    className="w-40 bg-white border border-gray-300 text-gray-700 rounded-full px-4 py-2 text-base shadow-sm appearance-none"
                    value={editForm.appointment_time}
                    onChange={(e) => {
                      setEditForm((prev) => ({
                        ...prev,
                        appointment_time: e.target.value,
                      }));
                    }}
                  >
                    {[
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
                    ].map((timeShort) => {
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
                      className="w-40 border border-gray-300 rounded-full px-4 py-2 text-black bg-white cursor-pointer shadow-sm appearance-none pr-10"
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
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex justify-end gap-4">
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                onClick={() => {
                  if (!selectedAppointment) return;

                  // So sánh status hiện tại với status trong form edit
                  const isStatusChanged =
                    editForm.status !== selectedAppointment.status;

                  // Chuẩn bị dữ liệu gửi lên API
                  const updatedData = {
                    appointment_date: editForm.appointment_date,
                    appointment_time: editForm.appointment_time,
                    notes: editForm.notes,
                    // chỉ thêm status nếu có thay đổi
                    ...(isStatusChanged && { status: editForm.status }),
                  };

                  console.log("updatedData", updatedData, isStatusChanged);

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
                        "❌ Failed to update appointment due to" +
                          (err?.message || err) +
                          ". Please contact the administrator."
                      );
                    });
                }}
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-800">
                ➕ Create New Appointment
              </h2>
              <button
                onClick={() => setIsPatientModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
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
                    Patient Name
                  </label>
                  <input
                    type="text"
                    className="w-120 border border-gray-300 rounded-full px-3 py-2 text-black placeholder-gray-400"
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
                    }}
                    placeholder="Enter patient name"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block mb-1 font-medium text-black">
                    Address
                  </label>
                  <input
                    type="text"
                    className="w-120 border border-gray-300 rounded-full px-3 py-2 text-black placeholder-gray-400"
                    value={editForm.address}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    placeholder="Enter address "
                  />
                </div>

                {/* Phone và Appointment Date cùng hàng ngang */}
                <div className="flex space-x-3">
                  {/* Phone */}
                  <div className="flex-1 min-w-[220px]">
                    <label className="block mb-1 font-medium text-black">
                      Phone
                    </label>
                    <input
                      type="text"
                      className="w-50 border border-gray-300 rounded-full px-3 py-2 text-black placeholder-gray-400"
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
                      }}
                      placeholder="Enter phone number "
                    />
                  </div>

                  <div className="flex-1 min-w-[120px]">
                    <label className="block mb-1 font-medium text-black">
                      Year of Birth
                    </label>

                    <div className="relative">
                      <select
                        className="w-full border border-gray-300 rounded-full px-4 py-2 text-black bg-white appearance-none pr-10"
                        value={editForm.birth_year}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            birth_year: e.target.value,
                          }))
                        }
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
                      Gender
                    </label>

                    <div className="relative">
                      <select
                        className="w-30 border border-gray-300 rounded-full px-4 py-2 text-black bg-white appearance-none pr-10"
                        value={editForm.gender}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val !== "") {
                            setEditForm((prev) => ({
                              ...prev,
                              gender: val,
                            }));
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
                          }));
                        }
                      }}
                      dateFormat="dd/MM/yyyy"
                      className="w-40 border border-gray-300 rounded-full px-4 py-2 pr-10 text-black bg-white appearance-none"
                      placeholderText="dd/mm/yyyy"
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
                      Appointment Time
                    </label>

                    <select
                      className="w-30 border border-gray-300 rounded-full px-4 py-2 text-black bg-white appearance-none pr-10"
                      value={editForm.appointment_time}
                      onChange={(e) => {
                        setEditForm((prev) => ({
                          ...prev,
                          appointment_time: e.target.value,
                        }));
                      }}
                    >
                      <option value="">Select Time</option>
                      {[
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
                      ].map((timeShort) => {
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
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                onClick={() => {
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
