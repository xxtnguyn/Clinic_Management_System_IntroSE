import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import HeaderDashboard from "../components/HeaderDashboard";
import TabHeaders from "../components/TabHeaders";
import BlueUnderline from "../components/BlueUnderline";
import Table from "../components/Table";

interface ReportData {
  id: number;
  date: string;
  patientCount: number;
  revenue: number;
  expenses: number;
}

const Report: React.FC = () => {
  const [activeTab, setActiveTab] = useState("DAILY");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [reportData, setReportData] = useState<ReportData[]>([]);

  const location = useLocation();
  const { user } = location.state || {};

  return (
    <div className="min-h-screen w-full">
      <HeaderDashboard currentUser={user} />
      <main className="container mx-auto px-8 py-6 mt-16">
        <div className="max-w-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden pb-50">
          <TabHeaders
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            headers={["DAILY", "MONTHLY", "YEARLY"]}
          />
          <BlueUnderline />
          <div className="p-6 bg-gray-50 min-h-96">
            {/* Month Selector */}
            <div className="mb-6">
              <div className="flex items-center gap-4">
                <span className="text-blue-600 font-medium">
                  {activeTab === "DAILY"
                    ? "Month"
                    : activeTab === "MONTHLY"
                    ? "Year"
                    : "From Year"}
                </span>
                <input
                  type={activeTab === "DAILY" ? "month" : "number"}
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min={activeTab === "DAILY" ? undefined : 2000}
                  max={
                    activeTab === "DAILY" ? undefined : new Date().getFullYear()
                  }
                />
              </div>
            </div>

            {/* Report Table */}
            <Table
              headers={["No.", "Date", "Patient Count", "Revenue", "Expenses"]}
              filteredItems={reportData}
              attributesOfItem={[
                "id",
                "date",
                "patientCount",
                "revenue",
                "expenses",
              ]}
            />
          </div>
          <BlueUnderline />
        </div>
      </main>
    </div>
  );
};

export default Report;
