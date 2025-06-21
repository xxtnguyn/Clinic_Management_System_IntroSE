import React from "react";
import DateSearchInput from "./DateSearchInput";
import PatientSearchInput from "./PatientSearchInput";
import StatusSelect from "./StatusSelect";

export interface SearchBarValues {
  date: string;
  name: string;
  status: string;
}

interface SearchBarProps {
  values: SearchBarValues;
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
  onNameChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  values,
  selectedDate,
  onDateChange,
  onNameChange,
  onStatusChange,
  onSearch,
  onClear,
}) => {
  return (
    <div className="mb-8 flex flex-wrap items-end gap-x-6 gap-4">
      <DateSearchInput
        selectedDate={selectedDate}
        onChange={(date) => {
          onDateChange(date);
          onSearch();
        }}
        label="Date"
      />

      <PatientSearchInput
        value={values.name}
        onChange={(value) => {
          onNameChange(value);
          onSearch();
        }}
        onEnter={onSearch}
      />

      <StatusSelect
        value={values.status}
        onChange={(value) => {
          onStatusChange(value);
          onSearch();
        }}
      />

      <div className="flex gap-4 ml-auto">
        <button
          type="button"
          onClick={onClear}
          className="border border-[#1250B1] text-[#1250B1] px-6 py-2 rounded hover:bg-[#f0f6ff] cursor-pointer"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
