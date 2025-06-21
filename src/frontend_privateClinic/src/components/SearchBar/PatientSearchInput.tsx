import React from "react";
import searchIcon from "../../assets/search.png";

interface PatientSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  placeholder?: string;
  onEnter?: () => void;
}

const PatientSearchInput: React.FC<PatientSearchInputProps> = ({
  value,
  onChange,
  label = "Patient Name",
  className = "flex-1 max-w-md",
  placeholder = "Search...",
  onEnter,
}) => {
  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm text-[#1250B1] mb-1 font-medium">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-full px-4 py-2 pr-10 text-black shadow-sm placeholder-gray-400 bg-white"
        onKeyDown={(e) => {
          if (e.key === "Enter" && typeof onEnter === "function") {
            onEnter();
          }
        }}
      />

      {/* Search icon */}
      <div className="pointer-events-none absolute inset-y-11 right-5 flex items-center">
        <img
          src={searchIcon}
          alt="search icon"
          className="w-5 h-5"
          draggable={false}
        />
      </div>
    </div>
  );
};

export default PatientSearchInput;
