import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import HeaderDashboard from "../components/HeaderDashboard";
import { useLocation } from "react-router-dom";
import TabHeaders from "../components/TabHeaders";
import BlueUnderline from "../components/BlueUnderline";
import Table from "../components/Table";
import { medicineService } from "../api/medicine.service";
import { invoiceService } from "../api/invoice.service";

interface Item {
  medicine_id: number;
  id: number;
  name: string;
  unit: string;
  quantity: number;
  examination_date: string;
  total_fee: string;
  number_of_patients: number;
  revenue: number;
  patient_id: number;
  profit_margin: string;
  date: string;
  examination_fee_total: string;
  medicine_fee_total: string;
  patient_count: string;
  total_revenue: string;
}
{
  /*
const defaultItem: Item = {
  medicine_id: 0,
  id: 0,
  name: "",
  unit: "",
  quantity: 0,
  examination_date: "",
  total_fee: "",
  number_of_patients: 0,
  revenue: 0,
  patient_id: 0,
  profit_margin: "",
  date: "",
  examination_fee_total: "",
  medicine_fee_total: "",
  patient_count: "",
  total_revenue: "",
};
*/
}

type ItemKey = keyof Item;

const Report = () => {
  const [activeTab, setActiveTab] = useState("MEDICINE");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [basedOn, setBasedOn] = useState<ItemKey | "">("");
  const [presentList, setPresentList] = useState<Item[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Item[]>([]);
  const [revenues, setRevenues] = useState<Item[]>([]);
  const [filteredRevenues, setFilteredRevenues] = useState<Item[]>([]);

  const location = useLocation();

  const { user } = location.state || {};

  const [medicineStatistic, setMedicineStatistic] = useState<Item[]>([]);

  // Tim ngay dau va ngay cuoi thang
  function getStartAndEndOfMonth(monthStr: string): {
    start: string;
    end: string;
  } {
    const [yearStr, monthStrOnly] = monthStr.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStrOnly, 10);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const formatDate = (date: Date): string => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    return {
      start: formatDate(startDate),
      end: formatDate(endDate),
    };
  }
  const { start, end } = getStartAndEndOfMonth(selectedMonth);

  useEffect(() => {
    if (activeTab == "MEDICINE") {
      const fetchMedicineStatistic = async () => {
        const medicineStatistic = await medicineService.getStatistics(
          start,
          end
        );
        setMedicineStatistic(medicineStatistic);
      };

      fetchMedicineStatistic();
    }
  }, [activeTab, selectedMonth]);

  useEffect(() => {
    if (activeTab == "INCOME") {
      const fetchRevenue = async (date: string) => {
        const revenue = await invoiceService.getRevenueByDate(date);
        return revenue;
      };

      const startDate = new Date(start);
      const endDate = new Date(end);

      const fetchAllRevenues = async () => {
        const promises: Promise<any>[] = [];

        for (
          let d = new Date(startDate);
          d <= endDate;
          d.setDate(d.getDate() + 1)
        ) {
          const dChar = d.toISOString().split("T")[0];
          promises.push(fetchRevenue(dChar));
        }

        const revenues = await Promise.all(promises);

        var sum_revenue = 0;

        for (let i = 0; i < revenues.length; i++) {
          revenues[i].id = i;
          sum_revenue += Number(revenues[i].total_revenue);
        }

        for (let i = 0; i < revenues.length; i++) {
          revenues[i].profit_margin =
            String((Number(revenues[i].total_revenue) / sum_revenue) * 100) +
            "%";
        }

        setRevenues(revenues as Item[]);
      };

      fetchAllRevenues(); // gọi hàm async bên ngoài
    }
  }, [activeTab, selectedMonth]);

  useEffect(() => {
    setBasedOn("");
  }, [activeTab]);

  useEffect(() => {
    setSearchTerm("");
  }, [activeTab]);

  useEffect(() => {
    setSearchTerm("");
  }, [selectedMonth]);

  const handleSearch = (filteredItems: Item[]) => {
    var filteredItems_: Item[] = filteredItems;
    if (basedOn != "") {
      filteredItems_ = filteredItems.filter((item) =>
        String(item[basedOn])
          .toLowerCase()
          .startsWith(String(searchTerm).toLowerCase())
      );
    } else if (searchTerm == "") {
      if (activeTab == "MEDICINE") {
        setPresentList(medicineStatistic);
      } else {
        setPresentList(revenues);
      }
    } else {
      console.log("Please choose Based on");
    }
    setPresentList(filteredItems_);
  };

  useEffect(() => {
    if (activeTab == "MEDICINE") {
      setFilteredMedicines(medicineStatistic);
    } else {
      setFilteredRevenues(revenues);
    }
  }, [medicineStatistic, revenues, activeTab]);

  useEffect(() => {
    if (activeTab === "MEDICINE") {
      setPresentList(filteredMedicines);
    } else {
      setPresentList(filteredRevenues);
    }
  }, [activeTab, filteredRevenues, filteredMedicines]);

  return (
    <div className="min-h-screen w-full">
      <HeaderDashboard currentUser={user} />

      <main className="container mx-auto px-8 py-6 mt-16">
        <div className="max-w-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden pb-50">
          {/* Tab Headers */}
          <TabHeaders
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            headers={["INCOME", "MEDICINE"]}
          />

          {/* Blue underline */}
          <BlueUnderline />

          {/* Content Area */}
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
                  {basedOn != "date" && (
                    <>
                      <input
                        id="myInput"
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
                    </>
                  )}

                  {basedOn == "date" && (
                    <select
                      className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onChange={(e) => setSearchTerm(e.target.value)}
                    >
                      <option value="">--Choose the day--</option>
                      {Array.from(
                        { length: Number(end.slice(-2)) },
                        (_, i) => i + 1
                      ).map((num) => (
                        <option
                          key={num}
                          value={
                            selectedMonth + "-" + String(num).padStart(2, "0")
                          }
                        >
                          Day {num}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <span className="text-blue-600 font-light italic">
                  Based on
                </span>
                <select
                  value={basedOn}
                  onChange={(e) => {
                    setBasedOn(e.target.value as ItemKey);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
                >
                  <option value="">-- Choose --</option>
                  {activeTab === "MEDICINE" && (
                    <>
                      <option value="id">Medicine ID</option>
                      <option value="name">Medicine Name</option>
                    </>
                  )}

                  {activeTab === "INCOME" && (
                    <>
                      <option value="date">Examination Date</option>
                    </>
                  )}
                </select>
                <button
                  onClick={() => {
                    if (activeTab === "MEDICINE") {
                      handleSearch(filteredMedicines);
                    } else {
                      handleSearch(filteredRevenues);
                    }
                  }}
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
                >
                  Find
                </button>
              </div>
            </div>

            {/* Table */}
            {activeTab === "MEDICINE" && (
              <Table
                headers={[
                  "Medicine ID",
                  "Medicine Name",
                  "Unit",
                  "Quantity",
                  "Usage Time",
                ]}
                filteredItems={presentList}
                attributesOfItem={[
                  "id",
                  "name",
                  "unit",
                  "total_quantity",
                  "prescription_count",
                ]}
              />
            )}

            {activeTab === "INCOME" && (
              <Table
                headers={[
                  "Examination Date",
                  "Number of patients",
                  "Revenue",
                  "Profit Margin",
                ]}
                filteredItems={presentList}
                attributesOfItem={[
                  "date",
                  "patient_count",
                  "total_revenue",
                  "profit_margin",
                ]}
              />
            )}
          </div>

          {/* Blue underline at bottom */}
          <BlueUnderline />
        </div>
      </main>
    </div>
  );
};

export default Report;
