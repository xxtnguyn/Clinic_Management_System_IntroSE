export default function TabHeaders({
  activeTab,
  setActiveTab,
  headers,
}: {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  headers: string[];
}) {
  return (
    <div className="flex w-fit">
      {headers.map((header, index) => {
        return (
          <button
            className={`w-64 py-2 px-4 text-sm font-medium transition-all duration-300 ${
              activeTab === header
                ? "bg-[#1250B1] text-white"
                : "bg-blue-300 text-blue-500 opacity-60 hover:opacity-80"
            }`}
            onClick={() => setActiveTab(header)}
            key={index}
          >
            {header}
          </button>
        );
      })}
    </div>
  );
}
