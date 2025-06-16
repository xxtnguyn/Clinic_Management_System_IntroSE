import type { ReactElement } from "react";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Search } from "lucide-react";

import HeaderDashboard from "../components/HeaderDashboard";
import TabHeaders from "../components/TabHeaders";
import BlueUnderline from "../components/BlueUnderline";
import Table from "../components/Table";

interface Medicine {
  id: number;
  name: string;
  unit: string;
  quantity: number;
  usageTime: string;
}

export default function Regulations(): ReactElement {
  const [activeTab, setActiveTab] = useState("MEDICINE");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [basedOn, setBasedOn] = useState("No.");
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  const location = useLocation();
  const { user } = location.state || {};

  const handleSearch = () => {
    // Implement search logic here
    console.log("Searching for:", searchTerm, "Based on:", basedOn);
  };

  const filteredMedicines = medicines;

  return (
    <div className="min-h-screen w-full">
      <HeaderDashboard currentUser={user} />

      <main className="container mx-auto px-8 py-6 mt-16">
        <div className="max-w-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden pb-50">
          {/* Tab Headers */}
          <TabHeaders
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            headers={["OPERATION", "MEDICINE"]}
          />
          <BlueUnderline />
          <div className="p-6 bg-gray-50 min-h-96">
            {/* Month Selector and Search */}
            <div className="mb-6 space-y-4">
              {/* Month Selector */}
              <div className="flex items-center gap-4">
                <span className="text-blue-600 font-medium">Month</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Search Section */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                </div>

                <span className="text-blue-600 font-light italic">
                  Based on
                </span>
                <select
                  value={basedOn}
                  onChange={(e) => setBasedOn(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
                >
                  <option value="no.">No.</option>
                  {activeTab === "MEDICINE" && (
                    <option value="medicine">Medicine</option>
                  )}
                  {activeTab === "INCOME" && (
                    <option value="examination_date">Examination Date</option>
                  )}
                </select>

                <button
                  onClick={handleSearch}
                  className="px-6 py-2 text-blue-500 bg-white border border-blue-500 rounded-md hover:bg-blue-600 hover:text-white transition-colors font-medium"
                >
                  Find
                </button>

                <button className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium">
                  Add
                </button>
              </div>
            </div>

            {activeTab === "MEDICINE" && (
              <Table
                headers={["No.", "Medicine", "Unit", "Quantity", "Usage Time"]}
                filteredItems={filteredMedicines}
                attributesOfItem={[
                  "id",
                  "name",
                  "unit",
                  "quantity",
                  "usageTime",
                ]}
              />
            )}
          </div>

          <BlueUnderline />
        </div>
      </main>
    </div>
  );
}
