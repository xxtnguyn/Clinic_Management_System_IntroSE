import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface MonthDatePickerProps {
  onMonthChange: (month: string) => void;
  onDateChange: (date: Date | null) => void;
  selectedMonth: string;
  selectedDate: Date | null;
}

const MonthDatePicker: React.FC<MonthDatePickerProps> = ({
  onMonthChange,
  onDateChange,
  selectedMonth,
  selectedDate,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [monthDate, setMonthDate] = useState<Date | null>(
    selectedMonth ? new Date(selectedMonth + "-01") : null
  );

  // Update monthDate when selectedMonth changes
  useEffect(() => {
    if (selectedMonth) {
      setMonthDate(new Date(selectedMonth + "-01"));
    }
  }, [selectedMonth]);

  const handleMonthChange = (date: Date | null) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const monthString = `${year}-${month}`;
      setMonthDate(date);
      onMonthChange(monthString);

      // Reset selected date if it's outside the new month
      if (selectedDate) {
        const selectedYear = selectedDate.getFullYear();
        const selectedMonthNum = selectedDate.getMonth();
        if (selectedYear !== year || selectedMonthNum !== date.getMonth()) {
          onDateChange(null);
        }
      }
    }
  };

  const handleDateChange = (date: Date | null) => {
    onDateChange(date);
  };

  const getMonthStartDate = (): Date | undefined => {
    if (!monthDate) return undefined;
    return new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  };

  const getMonthEndDate = (): Date | undefined => {
    if (!monthDate) return undefined;
    return new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  };

  return (
    <div className="space-y-4">
      {/* Main Row: Month, Date, Checkbox, Clear */}
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          {/* Month Picker */}
          <div className="flex items-center gap-4">
            <span className="text-blue-600 font-medium text-sm">Month</span>
            <div className="relative">
              <DatePicker
                selected={monthDate}
                onChange={handleMonthChange}
                dateFormat="MMMM yyyy"
                showMonthYearPicker
                placeholderText="Select month"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-w-[140px]"
                popperClassName="z-[99999]"
                popperPlacement="bottom-start"
                portalId="root"
              />
            </div>
          </div>

          {/* Date Picker - Only show when checkbox is checked */}
          {showDatePicker && monthDate && (
            <div className="flex items-center gap-4">
              <span className="text-blue-600 font-medium text-sm">Date</span>
              <div className="relative">
                <DatePicker
                  selected={selectedDate}
                  onChange={handleDateChange}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select date"
                  minDate={getMonthStartDate()}
                  maxDate={getMonthEndDate()}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-w-[120px]"
                  popperClassName="z-[99999]"
                  popperPlacement="bottom-start"
                  portalId="root"
                />
              </div>
              {selectedDate && (
                <span className="text-xs text-gray-500">
                  {selectedDate.toLocaleDateString("vi-VN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          )}

          {/* Date Detail Checkbox */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showDatePicker"
              checked={showDatePicker}
              onChange={(e) => setShowDatePicker(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label
              htmlFor="showDatePicker"
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              Chi tiết theo ngày
            </label>
          </div>
        </div>

        {/* Clear Button */}
        {(selectedMonth !== new Date().toISOString().slice(0, 7) ||
          selectedDate) && (
          <button
            onClick={() => {
              onMonthChange(new Date().toISOString().slice(0, 7));
              onDateChange(null);
              setShowDatePicker(false);
            }}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100 transition-colors font-medium"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default MonthDatePicker;
