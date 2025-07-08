import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import HeaderDashboard from "../components/HeaderDashboard";
import { useLocation } from "react-router-dom";
import TabHeaders from "../components/TabHeaders";
import BlueUnderline from "../components/BlueUnderline";
import Table from "../components/Table";
import { medicineService } from "../api/medicine.service";
import { invoiceService } from "../api/invoice.service";
import MonthDatePicker from "../components/MonthDatePicker";
import MonthPicker from "../components/MonthPicker";
import { MedicineSearchInput } from "../components/SearchBar";
import { formatDateForAPI, formatDateForDisplay } from "../utils/dateUtils.ts";
import { formatNumberWithThousandSeparator } from "../utils/currencyUtils.ts";

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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
          if (sum_revenue == 0) {
            revenues[i].profit_margin = "None";
          } else {
            revenues[i].profit_margin =
              String((Number(revenues[i].total_revenue) / sum_revenue) * 100) +
              "%";
          }
        }

        setRevenues(revenues as Item[]);
      };

      fetchAllRevenues(); // gọi hàm async bên ngoài
    }
  }, [activeTab, selectedMonth]);

  useEffect(() => {
    setSearchTerm("");
    setSelectedDate(null);
  }, [activeTab]);

  useEffect(() => {
    setSearchTerm("");
    setSelectedDate(null);
  }, [selectedMonth]);

  // Auto search when date is selected in INCOME tab
  useEffect(() => {
    if (activeTab === "INCOME" && selectedDate) {
      handleSearch(filteredRevenues);
    } else if (activeTab === "INCOME" && !selectedDate) {
      // Show all revenues for the selected month when no date is selected
      setPresentList(revenues);
    }
  }, [selectedDate, activeTab, filteredRevenues, revenues]);

  const handleSearch = (filteredItems: Item[]) => {
    var filteredItems_: Item[] = filteredItems;

    if (activeTab === "INCOME" && selectedDate) {
      // console.log("Selected date: ", selectedDate);

      // Use formatDateForDisplay to get the date in dd/MM/yyyy format for comparison
      const searchDateDisplay = formatDateForDisplay(
        formatDateForAPI(selectedDate)
      );
      filteredItems_ = filteredItems.filter((item) => {
        const itemDateDisplay = formatDateForDisplay(item.date);
        // console.log("Displayed date: ", itemDateDisplay);
        return itemDateDisplay === searchDateDisplay;
      });
    } else if (activeTab === "MEDICINE" && searchTerm !== "") {
      // For medicine tab, search by medicine name
      filteredItems_ = filteredItems.filter((item) =>
        String(item.name)
          .toLowerCase()
          .startsWith(String(searchTerm).toLowerCase())
      );
    } else {
      // Show all items if no search criteria
      if (activeTab == "MEDICINE") {
        setPresentList(medicineStatistic);
      } else {
        setPresentList(revenues);
      }
      return;
    }
    setPresentList(filteredItems_);
  };

  useEffect(() => {
    if (activeTab === "MEDICINE") {
      setFilteredMedicines(medicineStatistic);
    } else {
      setFilteredRevenues(revenues);
    }
  }, [medicineStatistic, revenues, activeTab]);

  useEffect(() => {
    if (activeTab === "MEDICINE") {
      if (searchTerm.trim() === "") {
        setPresentList(medicineStatistic);
      } else {
        setPresentList(
          medicineStatistic.filter((item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      }
    }
  }, [searchTerm, medicineStatistic, activeTab]);

  return (
    <div className="min-h-screen w-full">
      <HeaderDashboard currentUser={user} />

      <main className="container mx-auto px-8 py-6 mt-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Report</h1>
        <div className="max-w-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
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
              {/* Month Selector - Different for each tab */}
              {activeTab === "INCOME" ? (
                <MonthDatePicker
                  selectedMonth={selectedMonth}
                  selectedDate={selectedDate}
                  onMonthChange={setSelectedMonth}
                  onDateChange={setSelectedDate}
                />
              ) : (
                <MonthPicker
                  selectedMonth={selectedMonth}
                  onMonthChange={setSelectedMonth}
                />
              )}

              {/* Search Section - Only for MEDICINE tab */}
              {activeTab === "MEDICINE" && (
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <MedicineSearchInput
                      value={searchTerm}
                      onChange={setSearchTerm}
                      placeholder="Search by medicine name..."
                    />
                  </div>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setPresentList(medicineStatistic);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100 transition-colors font-medium"
                  >
                    Clear
                  </button>
                </div>
              )}
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
                weights={[
                  "w-[100px]",
                  "w-[200px]",
                  "w-[300px]",
                  "w-[200px]",
                  "w-[200px]",
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
                filteredItems={presentList.map((item) => {
                  const revenueNum = Number(item.total_revenue);
                  let profitMarginDisplay = item.profit_margin;
                  if (revenueNum === 0) {
                    profitMarginDisplay = "0%";
                  } else if (
                    item.profit_margin &&
                    item.profit_margin !== "None"
                  ) {
                    profitMarginDisplay = `${parseFloat(
                      item.profit_margin
                    ).toFixed(4)}%`;
                  }
                  return {
                    ...item,
                    date: formatDateForDisplay(item.date),
                    total_revenue: `${formatNumberWithThousandSeparator(
                      revenueNum
                    )} VND`,
                    profit_margin: profitMarginDisplay,
                  };
                })}
                attributesOfItem={[
                  "date",
                  "patient_count",
                  "total_revenue",
                  "profit_margin",
                ]}
                weights={["w-[200px]", "w-[300px]", "w-[200px]", "w-[200px]"]}
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
