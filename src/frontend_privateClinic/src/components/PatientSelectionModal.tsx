import React, { useState, useEffect } from "react";
import searchIcon from "../assets/search.png";

interface Patient {
  id: number;
  full_name: string;
  gender: string;
  birth_year: number;
  phone: string;
  address: string;
}

interface PatientSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPatient: (patient: Patient) => void;
  patients: Patient[];
  isLoading?: boolean;
  error?: string;
}

const PatientSelectionModal: React.FC<PatientSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectPatient,
  patients,
  isLoading = false,
  error = "",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedPatientId(null); // Reset chọn dòng khi modal mở
    }
  }, [isOpen]);

  const filteredPatients = patients.filter((patient) => {
    if (!patient) return false;
    const matchName =
      typeof patient.full_name === "string" &&
      patient.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPhone =
      typeof patient.phone === "string" &&
      patient.phone.includes(searchTerm);
    return matchName || matchPhone;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Select Existing Patient
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-full px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <img
                src={searchIcon}
                alt="search"
                className="w-5 h-5 opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Patient List */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 p-4">
              <svg
                className="w-8 h-8 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>{error}</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center text-gray-500 p-4">
              <svg
                className="w-8 h-8 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p>No patients found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Birth Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    onClick={() => {
                      setSelectedPatientId(patient.id);
                      onSelectPatient(patient);
                      onClose();
                    }}
                    className={`cursor-pointer hover:bg-blue-50 ${
                      selectedPatientId === patient.id ? "bg-blue-100" : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">{patient.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{patient.gender}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{patient.birth_year}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{patient.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{patient.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientSelectionModal;
