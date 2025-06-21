import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface MonthPickerProps {
  onMonthChange: (month: string) => void;
  selectedMonth: string;
}

const MonthPicker: React.FC<MonthPickerProps> = ({
  onMonthChange,
  selectedMonth,
}) => {
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
    }
  };

  return (
    <div className="flex items-center gap-4 relative z-20">
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
  );
};

export default MonthPicker;
