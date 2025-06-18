import HeaderDashboard from "../components/HeaderDashboard";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import TabHeaders from "../components/TabHeaders";
import BlueUnderline from "../components/BlueUnderline";
import { Search } from "lucide-react";
import Table from "../components/Table";
import { medicineService } from "../api/medicine.service";
import type { CreateMedicineInput } from "../api/medicine.service";
import axios from "axios";
import { settingService } from "../api/setting.service";
import type { Setting } from "../api/setting.service";
import { formatNumberWithThousandSeparator } from "../utils/currencyUtils.ts";
import { MedicineSearchInput } from "../components/SearchBar";

interface Medicine {
  id: number;
  name: string;
  unit: string;
  quantity_in_stock: number;
  price: string;
  description: string;
}

export default function Regulations() {
  const [activeTab, setActiveTab] = useState("MEDICINE");
  const [searchTerm, setSearchTerm] = useState("");
  const [basedOn, setBasedOn] = useState<keyof Medicine | "">("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [presentList, setPresentList] = useState<Medicine[]>([]);
  const [choosedMedicine, setChoosedMedicine] = useState<Medicine | null>();
  const [isAddingMedicine, setIsAddingMedicine] = useState(false);
  const [isEditingMedicine, setIsEditingMedicine] = useState(false);
  const [fetch, setFetch] = useState(0);
  const [examinationFee, setExamonationFee] = useState(0);
  const [maxPatientsPerDay, setMaxPatientsPerDay] = useState(0);
  const [maxDiseaseTypes, setMaxDiseaseTypes] = useState(0);
  const [maxMedicines, setMaxMedicines] = useState(0);

  const location = useLocation();

  const { user } = location.state || {};

  const filteredMedicines = medicines;

  // Format data for table display with thousand separators for price
  const formattedPresentList = presentList.map((medicine) => ({
    ...medicine,
    price: `${formatNumberWithThousandSeparator(Number(medicine.price))} VND`,
  }));

  const handleSearch = () => {
    var filteredMedicines_ = filteredMedicines;
    if (searchTerm !== "") {
      // Search by medicine name only
      filteredMedicines_ = filteredMedicines.filter((item) =>
        String(item.name)
          .toLowerCase()
          .startsWith(String(searchTerm).toLowerCase())
      );
    } else {
      // Show all medicines if no search term
      setPresentList(medicines);
      return;
    }
    setPresentList(filteredMedicines_);
  };

  const handleChoose = (id: number) => {
    if (!isEditingMedicine) return; // Only allow selection when in editing mode

    for (let i = 0; i < presentList.length; i++) {
      if (presentList[i].id == id) {
        setChoosedMedicine({ ...presentList[i] });
        break;
      }
    }
  };

  const handleChangeAttr = (attr: keyof Medicine, value: any) => {
    const new_medicine: Medicine = {
      ...choosedMedicine,
      [attr]: value,
      id: choosedMedicine?.id,
    } as Medicine;

    setChoosedMedicine(new_medicine);
  };

  const handleChangeExaminationFee = (value: number) => {
    setExamonationFee(Math.max(0, value));
  };

  const handleChangeMaxPatientsPerDay = (value: number) => {
    setMaxPatientsPerDay(Math.max(0, value));
  };

  const handleChangeMaxDiseaseTypes = (value: number) => {
    setMaxDiseaseTypes(Math.max(0, value));
  };

  const handleChangeMaxMedicines = (value: number) => {
    setMaxMedicines(Math.max(0, value));
  };

  const handleSave = async (new_medicine: Medicine) => {
    try {
      const createMedicineInput: CreateMedicineInput = {
        name: new_medicine.name,
        unit: new_medicine.unit,
        price: new_medicine.price,
        quantity_in_stock: new_medicine.quantity_in_stock,
        description: new_medicine.description,
      };
      await medicineService.createMedicine(createMedicineInput);
      alert("Thuốc đã được tạo thành công");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || "Đã xảy ra lỗi khi tạo thuốc";
        alert(message); // hoặc toast(message)
      } else {
        alert("Lỗi không xác định");
      }
    }
  };

  const handleSaveOperation = async (settings: Setting[]) => {
    var res = "";
    for (const setting of settings) {
      try {
        await settingService.updateByKey(setting);
        res = "Cập nhật thành công ";
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const message =
            error.response?.data?.message || "Đã xảy ra lỗi khi update";
          res += message + "\n"; // hoặc toast(message)
        } else {
          res += "Lỗi không xác định" + "\n";
        }
      }
    }
    alert(res);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await medicineService.deleteMedicine(id);
      alert(res.message); // hoặc toast
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdate = async (medicine: Medicine) => {
    var res = "";
    try {
      const res1 = await medicineService.updateMedicineInformation(medicine);
      res += res1.message;
    } catch (err: any) {
      res += err.message;
    }
    try {
      const res2 = await medicineService.addMedicineQuantity(medicine);
      res += "\n" + res2.message;
    } catch (err: any) {
      res += "\n" + err.message;
    }
    alert(res);
  };

  useEffect(() => {
    if (isAddingMedicine || (choosedMedicine && choosedMedicine.id))
      window.scrollTo({
        top: document.documentElement.scrollHeight, // Cuộn đến cuối trang
        behavior: "smooth", // Cuộn mượt mà
      });
  }, [isAddingMedicine, choosedMedicine]);

  useEffect(() => {
    setPresentList(medicines);
  }, [medicines]);

  useEffect(() => {
    const fetchMedicines = async () => {
      const medicines = await medicineService.getMedicines();
      setMedicines(medicines);
    };

    fetchMedicines();
  }, [fetch, activeTab]);

  useEffect(() => {
    setBasedOn("");
  }, [activeTab, fetch]);

  useEffect(() => {
    setChoosedMedicine(undefined);
  }, [activeTab]);

  useEffect(() => {
    setSearchTerm("");
  }, [activeTab]);

  useEffect(() => {
    setIsAddingMedicine(false);
  }, [activeTab]);

  useEffect(() => {
    setIsEditingMedicine(false);
  }, [activeTab]);

  useEffect(() => {
    if (isAddingMedicine) {
      setChoosedMedicine(null);
    }
  }, [isAddingMedicine]);

  useEffect(() => {
    if (
      choosedMedicine &&
      choosedMedicine.id !== undefined &&
      choosedMedicine.id !== 0
    ) {
      setIsAddingMedicine(false);
    }
  }, [choosedMedicine]);

  useEffect(() => {
    const fetchExaminationFee = async () => {
      const examinationFee = await settingService.getValueByKey(
        "examination_fee"
      );
      setExamonationFee(examinationFee);
    };

    fetchExaminationFee();
  }, [activeTab]);

  useEffect(() => {
    const fetchMaxPatientsPerDay = async () => {
      const maxPatientsPerDay = await settingService.getValueByKey(
        "max_patients_per_day"
      );
      setMaxPatientsPerDay(maxPatientsPerDay);
    };

    fetchMaxPatientsPerDay();
  }, [activeTab]);

  useEffect(() => {
    const fetchMaxDiseaseTypes = async () => {
      const maxDiseaseTypes = await settingService.getValueByKey(
        "max_disease_types"
      );
      setMaxDiseaseTypes(maxDiseaseTypes);
    };

    fetchMaxDiseaseTypes();
  }, [activeTab]);

  useEffect(() => {
    const fetchMaxMedicines = async () => {
      const maxMedicines = await settingService.getValueByKey("max_medicines");
      setMaxMedicines(maxMedicines);
    };

    fetchMaxMedicines();
  }, [activeTab]);

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
            {activeTab === "MEDICINE" && (
              <>
                {/* Search Section */}
                <div className="mb-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                      <MedicineSearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search by medicine name..."
                      />
                    </div>

                    <button
                      onClick={handleSearch}
                      className="px-6 py-2 bg-[#1250B1] text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                      Search
                    </button>

                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setPresentList(medicines);
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100 transition-colors font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === "MEDICINE" && (
              <>
                <p className="text-blue-600 font-semibold text-lg mt-4 mb-2">
                  {isEditingMedicine ? "Select a medication" : ""}
                </p>
                <Table
                  headers={[
                    "Medicine ID",
                    "Medicine",
                    "Unit",
                    "Quantity",
                    "Price",
                  ]}
                  filteredItems={formattedPresentList}
                  attributesOfItem={[
                    "id",
                    "name",
                    "unit",
                    "quantity_in_stock",
                    "price",
                  ]}
                  weights={[
                    "w-[100px]",
                    "w-[200px]",
                    "w-[300px]",
                    "w-[200px]",
                    "w-[200px]",
                  ]}
                  handleChoose={handleChoose}
                  selectedItemId={choosedMedicine?.id || null}
                  isEditing={isEditingMedicine}
                />

                {/* Edit and Add Buttons - positioned below table */}
                <div className="flex justify-between items-center mt-6">
                  <button
                    onClick={() => {
                      setIsAddingMedicine(!isAddingMedicine);
                      if (!isAddingMedicine) {
                        setChoosedMedicine({
                          id: 0,
                          name: "",
                          unit: "",
                          quantity_in_stock: 0,
                          price: "",
                          description: "",
                        });
                        setIsEditingMedicine(false);
                      } else {
                        setChoosedMedicine(null);
                        setIsEditingMedicine(false);
                      }
                    }}
                    className={`px-6 py-2 rounded-md transition-colors font-medium ${
                      isAddingMedicine
                        ? "bg-gray-500 text-white hover:bg-gray-700"
                        : "bg-blue-500 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isAddingMedicine ? "Cancel Creating" : "Add Medicine"}
                  </button>

                  <button
                    onClick={() => {
                      setIsEditingMedicine(!isEditingMedicine);
                      if (!isEditingMedicine) {
                        setChoosedMedicine(null);
                        setIsAddingMedicine(false);
                      }
                    }}
                    className={`px-6 py-2 rounded-md transition-colors font-medium ${
                      isEditingMedicine
                        ? "bg-gray-500 text-white hover:bg-gray-700"
                        : "bg-[#1250B1] text-white hover:bg-blue-700"
                    }`}
                  >
                    {isEditingMedicine ? "Cancel Editing" : "Edit"}
                  </button>
                </div>
                {(choosedMedicine || isAddingMedicine) && (
                  <div className="max-w-full mx-auto bg-white p-6 rounded shadow mt-10">
                    <h2 className="text-xl font-bold text-blue-600 mb-1">
                      {isAddingMedicine
                        ? "Add New Medicine"
                        : choosedMedicine?.name}
                    </h2>
                    <p className="text-sm text-blue-400 mb-4">
                      {!isAddingMedicine && choosedMedicine?.id && (
                        <>ID. {choosedMedicine.id}</>
                      )}
                    </p>

                    <form className="space-y-4">
                      <div className="flex">
                        <div>
                          <label className="block text-sm text-blue-600 font-semibold mb-1">
                            Medicine Name
                          </label>
                          <input
                            type="text"
                            value={choosedMedicine ? choosedMedicine.name : ""}
                            placeholder={"Type here..."}
                            className="w-2/3 border border-blue-300 rounded-full px-3 py-2 text-black placeholder-gray-400"
                            onChange={(e) =>
                              handleChangeAttr("name", e.target.value)
                            }
                            disabled={!isAddingMedicine && !isEditingMedicine}
                          />
                        </div>
                        <div>
                          {isAddingMedicine && (
                            <label className="block text-sm text-blue-600 font-semibold mb-1">
                              Quantity
                            </label>
                          )}
                          {!isAddingMedicine && (
                            <label className="block text-sm text-blue-600 font-semibold mb-1">
                              Added Amount
                            </label>
                          )}
                          <input
                            type="text"
                            value={
                              choosedMedicine
                                ? choosedMedicine.quantity_in_stock
                                : 0
                            }
                            className="w-2/3 border border-blue-300 rounded-full px-3 py-2 text-black placeholder-gray-400"
                            onChange={(e) => {
                              handleChangeAttr(
                                "quantity_in_stock",
                                !isNaN(Number(e.target.value))
                                  ? Number(e.target.value)
                                  : 0
                              );
                            }}
                            disabled={!isAddingMedicine && !isEditingMedicine}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-blue-600 font-semibold mb-1">
                            Price
                          </label>
                          <input
                            type="text"
                            value={
                              choosedMedicine
                                ? `${formatNumberWithThousandSeparator(
                                    Number(choosedMedicine.price)
                                  )} VND`
                                : ""
                            }
                            placeholder={"Type here..."}
                            className="w-2/3 border border-blue-300 rounded-full px-3 py-2 text-black placeholder-gray-400"
                            onChange={(e) => {
                              // Remove VND and commas, then convert to number
                              const numericValue = e.target.value.replace(
                                /[^\d]/g,
                                ""
                              );
                              handleChangeAttr(
                                "price",
                                !isNaN(Number(numericValue))
                                  ? numericValue
                                  : "0"
                              );
                            }}
                            disabled={!isAddingMedicine && !isEditingMedicine}
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-blue-600 font-semibold mb-1">
                            Unit
                          </label>
                          <div className="relative">
                            <select
                              className="w-full border border-gray-300 rounded-full px-4 py-2 text-black bg-white appearance-none pr-10"
                              value={
                                choosedMedicine ? choosedMedicine.unit : ""
                              }
                              onChange={(e) => {
                                handleChangeAttr("unit", e.target.value);
                              }}
                              disabled={!isAddingMedicine && !isEditingMedicine}
                            >
                              <option value="viên">Viên</option>
                              <option value="chai">Chai</option>
                            </select>
                            {/* Icon mũi tên dropdown */}
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-blue-600 font-semibold mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={
                            choosedMedicine ? choosedMedicine.description : ""
                          }
                          placeholder={"Type here..."}
                          className="w-full border border-blue-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                          onChange={(e) => {
                            handleChangeAttr("description", e.target.value);
                          }}
                          disabled={!isAddingMedicine && !isEditingMedicine}
                        />
                      </div>

                      <div className="flex justify-start gap-4 pt-2">
                        {isAddingMedicine && (
                          <button
                            type="button"
                            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 font-semibold w-1/10 text-center"
                            onClick={() => {
                              if (choosedMedicine) {
                                handleSave(choosedMedicine);
                                setFetch(fetch + 1);
                                setIsAddingMedicine(false);
                                setChoosedMedicine(null);
                              }
                            }}
                          >
                            Save
                          </button>
                        )}
                        {!isAddingMedicine && isEditingMedicine && (
                          <button
                            type="button"
                            className="bg-[#1250B1] text-white border border-blue-700 px-6 py-2 rounded hover:bg-blue-600 font-semibold w-1/10 text-center"
                            onClick={() => {
                              handleUpdate(choosedMedicine as Medicine);
                              setFetch(fetch + 1);
                              setIsEditingMedicine(false);
                              setChoosedMedicine(null);
                            }}
                          >
                            Replace
                          </button>
                        )}
                        {!isAddingMedicine && isEditingMedicine && (
                          <button
                            type="button"
                            className="bg-white text-red-500 border border-red-500 px-6 py-2 rounded hover:bg-red-200 font-semibold w-1/10 text-center"
                            onClick={() => {
                              if (choosedMedicine) {
                                handleDelete(choosedMedicine.id);
                                setFetch(fetch + 1);
                                setIsEditingMedicine(false);
                                setChoosedMedicine(null);
                              }
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}
            {activeTab === "OPERATION" && (
              <>
                <div className="p-8 bg-white w-full max-w-5xl mx-auto">
                  <h2 className="text-2xl font-bold text-blue-600 mb-8">
                    Clinic's Operation
                  </h2>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-600 mb-1">
                        Examination fee
                      </label>
                      <input
                        type="text"
                        className="w-full border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. 100,000"
                        value={formatNumberWithThousandSeparator(
                          examinationFee
                        )}
                        onChange={(e) => {
                          // Remove commas and convert to number
                          const numericValue = e.target.value.replace(/,/g, "");
                          handleChangeExaminationFee(
                            !isNaN(Number(numericValue))
                              ? Number(numericValue)
                              : 0
                          );
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-600 mb-1">
                        Maximum patients / day
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-inner-spin-button]:h-8 [&::-webkit-outer-spin-button]:h-8 [&::-webkit-inner-spin-button]:w-8 [&::-webkit-outer-spin-button]:w-8"
                        placeholder="e.g. 100"
                        value={maxPatientsPerDay}
                        onChange={(e) => {
                          handleChangeMaxPatientsPerDay(
                            !isNaN(Number(e.target.value))
                              ? Number(e.target.value)
                              : 0
                          );
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-600 mb-1">
                        Maximum disease types
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-inner-spin-button]:h-8 [&::-webkit-outer-spin-button]:h-8 [&::-webkit-inner-spin-button]:w-8 [&::-webkit-outer-spin-button]:w-8"
                        placeholder="e.g. 100"
                        value={maxDiseaseTypes}
                        onChange={(e) => {
                          handleChangeMaxDiseaseTypes(
                            !isNaN(Number(e.target.value))
                              ? Number(e.target.value)
                              : 0
                          );
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-600 mb-1">
                        Maximum medicines
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-inner-spin-button]:h-8 [&::-webkit-outer-spin-button]:h-8 [&::-webkit-inner-spin-button]:w-8 [&::-webkit-outer-spin-button]:w-8"
                        placeholder="e.g. 100"
                        value={maxMedicines}
                        onChange={(e) => {
                          handleChangeMaxMedicines(
                            !isNaN(Number(e.target.value))
                              ? Number(e.target.value)
                              : 0
                          );
                        }}
                      />
                    </div>
                  </div>

                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-6 py-2"
                    onClick={() => {
                      const settings: Setting[] = [
                        {
                          key: "examination_fee",
                          value: String(examinationFee),
                        },
                        {
                          key: "max_patients_per_day",
                          value: String(maxPatientsPerDay),
                        },
                        {
                          key: "max_disease_types",
                          value: String(maxDiseaseTypes),
                        },
                        { key: "max_medicines", value: String(maxMedicines) },
                      ];
                      handleSaveOperation(settings);
                    }}
                  >
                    Save
                  </button>
                </div>
              </>
            )}
          </div>

          <BlueUnderline />
        </div>
      </main>
    </div>
  );
}
