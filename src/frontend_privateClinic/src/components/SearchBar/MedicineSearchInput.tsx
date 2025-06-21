import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";

interface MedicineSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MedicineSearchInput: React.FC<MedicineSearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search medicine name...",
}) => {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-4 pr-10 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-400"
      />
      <Search
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        size={20}
      />
    </div>
  );
};

export default MedicineSearchInput;
