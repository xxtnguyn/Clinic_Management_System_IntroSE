import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DateSearchInputProps {
  selectedDate: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  className?: string;
  onSelect?: (date: Date | null) => void;
}

const DateSearchInput: React.FC<DateSearchInputProps> = ({
  selectedDate,
  onChange,
  label = "Appointment Date",
  className = "w-40",
  onSelect,
}) => {
  return (
    <div className={`relative ${className} z-50`}>
      <label className="block text-sm text-[#1250B1] mb-1 font-medium">
        {label}
      </label>
      <DatePicker
        selected={selectedDate}
        onChange={(date) => {
          onChange(date);
          if (typeof onSelect === "function") {
            onSelect(date);
          }
        }}
        dateFormat="dd/MM/yyyy"
        className="w-full border border-gray-300 rounded-full px-4 py-2 pr-10 text-black shadow-sm bg-white placeholder-gray-400"
        placeholderText="dd/mm/yyyy"
        popperClassName="z-50"
        popperPlacement="bottom-start"
      />

      {/* Dropdown arrow icon */}
      <div className="pointer-events-none absolute inset-y-11 right-4 flex items-center text-gray-500">
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
  );
};

export default DateSearchInput;
