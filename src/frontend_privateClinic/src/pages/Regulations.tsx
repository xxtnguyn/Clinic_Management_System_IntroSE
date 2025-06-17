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
  const [fetch, setFetch] = useState(0);
  const [examinationFee, setExamonationFee] = useState(0);
  const [maxPatientsPerDay, setMaxPatientsPerDay] = useState(0);
  const [maxDiseaseTypes, setMaxDiseaseTypes] = useState(0);
  const [maxMedicines, setMaxMedicines] = useState(0);

  const location = useLocation();

  const { user } = location.state || {};

  const filteredMedicines = medicines;

  const handleSearch = () => {
    var filteredMedicines_ = filteredMedicines;
    if (basedOn != "") {
      filteredMedicines_ = filteredMedicines.filter((item) =>
        String(item[basedOn])
          .toLowerCase()
          .startsWith(String(searchTerm).toLowerCase())
      );
    } else {
      console.log("Please choose Based on");
    }
    setPresentList(filteredMedicines_);
  };

  const handleChoose = (id: number) => {
    for (let i = 0; i < presentList.length; i++) {
      if (presentList[i].id == id) {
        setChoosedMedicine({ ...presentList[i], quantity_in_stock: 0 });
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
    setExamonationFee(value);
  };

  const handleChangeMaxPatientsPerDay = (value: number) => {
    setMaxPatientsPerDay(value);
  };

  const handleChangeMaxDiseaseTypes = (value: number) => {
    setMaxDiseaseTypes(value);
  };

  const handleChangeMaxMedicines = (value: number) => {
    setMaxMedicines(value);
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
        res += "Cập nhật thành công " + setting.key + "\n";
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
    if (isAddingMedicine) {
      setChoosedMedicine(null);
    }
  }, [isAddingMedicine]);

  useEffect(() => {
    if (choosedMedicine && choosedMedicine.id != undefined) {
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
                {/* Month Selector and Search */}
                <div className="mb-6 space-y-4">
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
                      onChange={(e) => {
                        const value = e.target.value as keyof Medicine;
                        setBasedOn(value);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
                    >
                      <option value="">-- Choose --</option>
                      <option value="id">Medicine ID</option>
                      <option value="name">Medicine Name</option>
                    </select>

                    <button
                      onClick={handleSearch}
                      className="px-6 py-2 text-blue-500 bg-white border border-blue-500 rounded-md hover:bg-blue-600 hover:text-white transition-colors font-medium"
                    >
                      Find
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === "MEDICINE" && (
              <>
                <p className="text-blue-600 font-semibold text-lg mt-4 mb-2">
                  Select the medication requiring an update
                </p>
                <Table
                  headers={[
                    "Medicine ID",
                    "Medicine",
                    "Unit",
                    "Quantity",
                    "Price",
                  ]}
                  filteredItems={presentList}
                  attributesOfItem={[
                    "id",
                    "name",
                    "unit",
                    "quantity_in_stock",
                    "price",
                  ]}
                  handleChoose={handleChoose}
                />

                <div className="p-6">
                  <button
                    className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
                    onClick={() => {
                      setIsAddingMedicine(true);
                    }}
                  >
                    Add a new medicine
                  </button>
                </div>
                {(choosedMedicine || isAddingMedicine) && (
                  <div className="max-w-full mx-auto bg-white p-6 rounded shadow mt-10">
                    <h2 className="text-xl font-bold text-blue-600 mb-1">
                      {choosedMedicine?.name}
                    </h2>
                    <p className="text-sm text-blue-400 mb-4">
                      {!isAddingMedicine && <>ID. {choosedMedicine?.id}</>}
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
                            className="w-2/3 border border-blue-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) =>
                              handleChangeAttr("name", e.target.value)
                            }
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
                            className="w-2/3 border border-blue-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => {
                              handleChangeAttr(
                                "quantity_in_stock",
                                !isNaN(Number(e.target.value))
                                  ? Number(e.target.value)
                                  : 0
                              );
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-blue-600 font-semibold mb-1">
                            Price
                          </label>
                          <input
                            type="text"
                            value={choosedMedicine ? choosedMedicine.price : ""}
                            className="w-2/3 border border-blue-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => {
                              handleChangeAttr(
                                "price",
                                !isNaN(Number(e.target.value))
                                  ? e.target.value
                                  : "0"
                              );
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-blue-600 font-semibold mb-1">
                            Unit
                          </label>
                          <select
                            className="w-full border border-blue-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={choosedMedicine ? choosedMedicine.unit : ""}
                            onChange={(e) => {
                              handleChangeAttr("unit", e.target.value);
                            }}
                          >
                            <option value="">-- Choose --</option>
                            <option value="viên">Viên</option>
                            <option value="chai">Chai</option>
                          </select>
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
                          className="w-full border border-blue-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onChange={(e) => {
                            handleChangeAttr("description", e.target.value);
                          }}
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
                              }
                            }}
                          >
                            Save
                          </button>
                        )}
                        {!isAddingMedicine && (
                          <button
                            type="button"
                            className="bg-white text-blue-500 border border-blue-500 px-6 py-2 rounded hover:bg-blue-600 font-semibold w-1/10 text-center"
                            onClick={() => {
                              handleUpdate(choosedMedicine as Medicine);
                              setFetch(fetch + 1);
                            }}
                          >
                            Replace
                          </button>
                        )}
                        {!isAddingMedicine && (
                          <button
                            type="button"
                            className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 font-semibold w-1/10 text-center"
                            onClick={() => {
                              if (choosedMedicine) {
                                handleDelete(choosedMedicine.id);
                                setFetch(fetch + 1);
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
                    Clinic’s Operation
                  </h2>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-600 mb-1">
                        Examination Fee
                      </label>
                      <input
                        type="number"
                        className="w-full border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. 100"
                        value={examinationFee}
                        onChange={(e) => {
                          handleChangeExaminationFee(
                            !isNaN(Number(e.target.value))
                              ? Number(e.target.value)
                              : 0
                          );
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-600 mb-1">
                        Maximum patients / Day
                      </label>
                      <input
                        type="number"
                        className="w-full border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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