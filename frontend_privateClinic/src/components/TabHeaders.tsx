import React from "react";

interface TabHeadersProps {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  headers: string[];
}

export default function TabHeaders({
  activeTab,
  setActiveTab,
  headers,
}: TabHeadersProps) {
  return (
    <div className="flex w-fit">
      {headers.map((header, index) => (
        <button
          className={`w-32 py-2 px-4 text-sm font-medium transition-all duration-300 ${
            activeTab === header
              ? "bg-blue-500 text-white"
              : "bg-blue-300 text-blue-500 opacity-60 hover:opacity-80"
          }`}
          onClick={() => setActiveTab(header)}
          key={`tab-${index}-${header}`}
        >
          {header}
        </button>
      ))}
    </div>
  );
}
