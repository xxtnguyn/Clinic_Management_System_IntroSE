import React, { useState, useRef, useEffect } from "react";

interface StatusOption {
  value: string;
  label: string;
}

interface StatusSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

const statusOptions: StatusOption[] = [
  { value: "", label: "All Status" },
  { value: "waiting", label: "Waiting" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

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

const StatusSelect: React.FC<StatusSelectProps> = ({
  value,
  onChange,
  label = "Status",
  className = "w-48",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <label className="block text-sm text-[#1250B1] mb-1 font-medium">
        {label}
      </label>

      <input
        type="text"
        readOnly
        value={
          statusOptions.find((opt) => opt.value === value)?.label ||
          "All Status"
        }
        className="w-full border border-gray-300 rounded-full px-4 py-2 text-black bg-white cursor-pointer shadow-sm appearance-none pr-10"
        onClick={() => setIsOpen(!isOpen)}
      />

      {/* Dropdown arrow icon */}
      <div className="pointer-events-none absolute inset-y-11 right-5 flex items-center text-gray-500">
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

      {/* Dropdown list */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
          {statusOptions.map((option) => (
            <div
              key={option.value}
              className={`px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center ${
                value === option.value ? "bg-gray-100" : ""
              }`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <span
                className={`px-2 py-0.5 rounded-full text-sm ${getStatusColor(
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
  );
};

export default StatusSelect;
