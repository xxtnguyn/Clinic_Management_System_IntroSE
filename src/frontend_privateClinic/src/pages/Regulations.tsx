import HeaderDashboard from "../components/HeaderDashboard";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import TabHeaders from "../components/TabHeaders";
import BlueUnderline from "../components/BlueUnderline";
import Table from "../components/Table";
import { medicineService } from "../api/medicine.service";
import type { CreateMedicineInput } from "../api/medicine.service";
import axios from "axios";
import { settingService } from "../api/setting.service";
import type { Setting } from "../api/setting.service";
import { diseaseTypeService } from "../api/diseaseType.service";
import type { DiseaseType } from "../api/diseaseType.service";
import { appointmentService } from "../api/appointment.service";
import { usageInstructionService } from "../api/usageInstruction.service";
import type { UsageInstruction } from "../api/usageInstruction.service";
import { formatNumberWithThousandSeparator } from "../utils/currencyUtils.ts";
import { MedicineSearchInput } from "../components/SearchBar";
// import {
//   diseaseTypeService,
//   type DiseaseType,
// } from "../api/diseaseType.service";
// import {
//   usageInstructionService,
//   type UsageInstruction,
// } from "../api/usageInstruction.service";

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
  const [maxUsageInstructions, setMaxUsageInstructions] = useState(0);
  const [diseaseTypes, setDiseaseTypes] = useState<DiseaseType[]>([]);
  const [presentDiseaseTypes, setPresentDiseaseTypes] = useState<DiseaseType[]>(
    []
  );
  const [searchDiseaseType, setSearchDiseaseType] = useState("");
  const [isAddingDiseaseType, setIsAddingDiseaseType] = useState(false);
  const [isEditingDiseaseType, setIsEditingDiseaseType] = useState(false);
  const [choosedDiseaseType, setChoosedDiseaseType] =
    useState<DiseaseType | null>();
  const [usageInstructions, setUsageInstructions] = useState<
    UsageInstruction[]
  >([]);
  const [presentUsageInstructions, setPresentUsageInstructions] = useState<
    UsageInstruction[]
  >([]);
  const [searchUsageInstruction, setSearchUsageInstruction] = useState("");
  const [isAddingUsageInstruction, setIsAddingUsageInstruction] =
    useState(false);
  const [isEditingUsageInstruction, setIsEditingUsageInstruction] =
    useState(false);
  const [choosedUsageInstruction, setChoosedUsageInstruction] =
    useState<UsageInstruction | null>();

  const location = useLocation();

  const { user } = location.state || {};

  // Format data for table display with thousand separators for price
  const formattedPresentList = presentList.map((medicine) => ({
    ...medicine,
    price: `${formatNumberWithThousandSeparator(Number(medicine.price))} VND`,
  }));

  const handleChoose = (id: number) => {
    if (!isEditingMedicine) return; // Only allow selection when in editing mode

    for (let i = 0; i < presentList.length; i++) {
      if (presentList[i].id == id) {
        setChoosedMedicine({ ...presentList[i], quantity_in_stock: 0 });
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

  const handleChangeMaxUsageInstructions = (value: number) => {
    setMaxUsageInstructions(Math.max(0, value));
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
    // Validate max_medicines
    const maxMedicinesSetting = settings.find((s) => s.key === "max_medicines");
    if (maxMedicinesSetting) {
      const maxMedicines = parseInt(maxMedicinesSetting.value, 10);
      const currentMedicinesCount = medicines.length;

      if (maxMedicines < currentMedicinesCount) {
        alert(
          `Không thể đặt số lượng thuốc tối đa (${maxMedicines}) nhỏ hơn số lượng thuốc hiện có (${currentMedicinesCount}).`
        );
        return;
      }
    }

    // Validate max_usage_instructions
    const maxUsageInstructionsSetting = settings.find(
      (s) => s.key === "max_usage_instructions"
    );
    if (maxUsageInstructionsSetting) {
      const newMaxUsageInstructions = parseInt(
        maxUsageInstructionsSetting.value,
        10
      );
      if (newMaxUsageInstructions < 1) {
        alert("Số lượng hướng dẫn sử dụng tối đa phải lớn hơn 0");
        return;
      }
    }

    // Validate max_disease_types
    const maxDiseaseTypesSetting = settings.find(
      (s) => s.key === "max_disease_types"
    );
    if (maxDiseaseTypesSetting) {
      const maxDiseaseTypes = parseInt(maxDiseaseTypesSetting.value, 10);
      try {
        const diseaseTypes = await diseaseTypeService.getDiseaseTypes();
        const currentDiseaseTypesCount = diseaseTypes.length;

        if (maxDiseaseTypes < currentDiseaseTypesCount) {
          alert(
            `Không thể đặt số loại bệnh tối đa (${maxDiseaseTypes}) nhỏ hơn số loại bệnh hiện có (${currentDiseaseTypesCount}).`
          );
          return;
        }
      } catch (error) {
        console.error("Error fetching disease types:", error);
      }
    }

    // Validate max_patients_per_day
    const maxPatientsSetting = settings.find(
      (s) => s.key === "max_patients_per_day"
    );
    if (maxPatientsSetting) {
      const maxPatients = parseInt(maxPatientsSetting.value, 10);
      const today = new Date().toISOString().split("T")[0];
      try {
        const appointments = await appointmentService.getAppointments(today);
        const currentAppointmentsCount = appointments.length;

        if (maxPatients < currentAppointmentsCount) {
          alert(
            `Không thể đặt số bệnh nhân tối đa mỗi ngày (${maxPatients}) nhỏ hơn số bệnh nhân đã đặt lịch hôm nay (${currentAppointmentsCount}).`
          );
          return;
        }
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    }

    // Validate max_usage_instructions
    const usageInstructionsSetting = settings.find(
      (s) => s.key === "max_usage_instructions"
    );
    if (usageInstructionsSetting) {
      const maxUsageInstructions = parseInt(usageInstructionsSetting.value, 10);
      try {
        // Fetch current usage instructions count from the server
        const usageInstructions =
          await usageInstructionService.getUsageInstructions();
        const currentUsageInstructionsCount = usageInstructions.length;

        if (maxUsageInstructions < currentUsageInstructionsCount) {
          alert(
            `Không thể đặt số hướng dẫn sử dụng tối đa (${maxUsageInstructions}) nhỏ hơn số hướng dẫn sử dụng hiện có (${currentUsageInstructionsCount}).`
          );
          return;
        }
      } catch (error) {
        console.error("Error fetching usage instructions:", error);
      }
    }

    let res = "";
    for (const setting of settings) {
      try {
        await settingService.updateByKey(setting);
        res = "Cập nhật thành công";
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const message =
            error.response?.data?.message || "Đã xảy ra lỗi khi update";
          res += message + "\n";
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
      const res2 = await medicineService.addMedicineQuantity(medicine);
      res += "\n" + res2.message;
    } catch (err: any) {
      res += err.message;
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
    setIsEditingMedicine(false);
  }, [fetch]);

  useEffect(() => {
    if (!isEditingMedicine && !isAddingMedicine) {
      setChoosedMedicine(null);
    }
  }, [isEditingMedicine]);

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
      setChoosedMedicine({
        id: 0,
        name: "",
        unit: "viên",
        quantity_in_stock: 0,
        price: "0",
        description: "",
      });
      setIsEditingMedicine(false);
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

    const fetchMaxUsageInstructions = async () => {
      const maxUsageInstructions = await settingService.getValueByKey(
        "max_usage_instructions"
      );
      setMaxUsageInstructions(maxUsageInstructions);
    };

    fetchMaxMedicines();
    fetchMaxUsageInstructions();
  }, [activeTab]);

  useEffect(() => {
    const fetchMaxUsageInstructions = async () => {
      const maxUsageInstructions = await settingService.getValueByKey(
        "max_usage_instructions"
      );
      setMaxUsageInstructions(maxUsageInstructions);
    };
    fetchMaxUsageInstructions();
  }, [activeTab]);

  useEffect(() => {
    const fetchDiseaseTypes = async () => {
      const types = await diseaseTypeService.getDiseaseTypes();
      setDiseaseTypes(types);
    };
    fetchDiseaseTypes();
  }, [fetch, activeTab]);

  useEffect(() => {
    setPresentDiseaseTypes(diseaseTypes);
  }, [diseaseTypes]);

  useEffect(() => {
    if (searchDiseaseType.trim() === "") {
      setPresentDiseaseTypes(diseaseTypes);
    } else {
      setPresentDiseaseTypes(
        diseaseTypes.filter((item) =>
          item.name.toLowerCase().includes(searchDiseaseType.toLowerCase())
        )
      );
    }
  }, [searchDiseaseType, diseaseTypes]);

  useEffect(() => {
    const fetchUsageInstructions = async () => {
      const instructions = await usageInstructionService.getUsageInstructions();
      setUsageInstructions(instructions);
    };
    fetchUsageInstructions();
  }, [fetch, activeTab]);

  useEffect(() => {
    setPresentUsageInstructions(usageInstructions);
  }, [usageInstructions]);

  useEffect(() => {
    if (searchUsageInstruction.trim() === "") {
      setPresentUsageInstructions(usageInstructions);
    } else {
      setPresentUsageInstructions(
        usageInstructions.filter((item) =>
          item.instruction
            .toLowerCase()
            .includes(searchUsageInstruction.toLowerCase())
        )
      );
    }
  }, [searchUsageInstruction, usageInstructions]);

  useEffect(() => {
    // Search động theo tên thuốc
    if (searchTerm.trim() === "") {
      setPresentList(medicines);
    } else {
      setPresentList(
        medicines.filter((item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, medicines]);

  // Disease Type handlers
  const handleChooseDiseaseType = (id: number) => {
    if (!isEditingDiseaseType) return;
    for (let i = 0; i < presentDiseaseTypes.length; i++) {
      if (presentDiseaseTypes[i].id === id) {
        setChoosedDiseaseType({ ...presentDiseaseTypes[i] });
        break;
      }
    }
  };
  const handleChangeDiseaseTypeAttr = (attr: keyof DiseaseType, value: any) => {
    if (!choosedDiseaseType) return;
    setChoosedDiseaseType({ ...choosedDiseaseType, [attr]: value });
  };
  const handleSaveDiseaseType = async (
    diseaseType: Omit<DiseaseType, "id">
  ) => {
    try {
      await diseaseTypeService.createDiseaseType(diseaseType);
      alert("Tạo loại bệnh thành công");
      setFetch(fetch + 1);
      setIsAddingDiseaseType(false);
      setChoosedDiseaseType(null);
    } catch (error: any) {
      alert(error.message || "Đã xảy ra lỗi khi tạo loại bệnh");
    }
  };
  const handleUpdateDiseaseType = async (diseaseType: DiseaseType) => {
    try {
      await diseaseTypeService.updateDiseaseType(diseaseType.id, diseaseType);
      alert("Cập nhật loại bệnh thành công");
      setFetch(fetch + 1);
    } catch (error: any) {
      alert(error.message || "Đã xảy ra lỗi khi cập nhật loại bệnh");
    }
  };
  const handleDeleteDiseaseType = async (id: number) => {
    try {
      await diseaseTypeService.deleteDiseaseType(id);
      alert("Xóa loại bệnh thành công");
      setFetch(fetch + 1);
      setChoosedDiseaseType(null);
    } catch (error: any) {
      alert(error.message || "Đã xảy ra lỗi khi xóa loại bệnh");
    }
  };
  // Usage Instruction handlers
  const handleChooseUsageInstruction = (id: number) => {
    if (!isEditingUsageInstruction) return;
    for (let i = 0; i < presentUsageInstructions.length; i++) {
      if (presentUsageInstructions[i].id === id) {
        setChoosedUsageInstruction({ ...presentUsageInstructions[i] });
        break;
      }
    }
  };
  const handleChangeUsageInstructionAttr = (
    attr: keyof UsageInstruction,
    value: any
  ) => {
    if (!choosedUsageInstruction) return;
    setChoosedUsageInstruction({ ...choosedUsageInstruction, [attr]: value });
  };
  const handleSaveUsageInstruction = async (
    usageInstruction: Omit<UsageInstruction, "id">
  ) => {
    try {
      await usageInstructionService.createUsageInstruction(usageInstruction);
      alert("Tạo cách dùng thành công");
      setFetch(fetch + 1);
      setIsAddingUsageInstruction(false);
      setChoosedUsageInstruction(null);
    } catch (error: any) {
      alert(error.message || "Đã xảy ra lỗi khi tạo cách dùng");
    }
  };
  const handleUpdateUsageInstruction = async (
    usageInstruction: UsageInstruction
  ) => {
    try {
      await usageInstructionService.updateUsageInstruction(
        usageInstruction.id,
        usageInstruction
      );
      alert("Cập nhật cách dùng thành công");
      setFetch(fetch + 1);
    } catch (error: any) {
      alert(error.message || "Đã xảy ra lỗi khi cập nhật cách dùng");
    }
  };
  const handleDeleteUsageInstruction = async (id: number) => {
    try {
      await usageInstructionService.deleteUsageInstruction(id);
      alert("Xóa cách dùng thành công");
      setFetch(fetch + 1);
      setChoosedUsageInstruction(null);
    } catch (error: any) {
      alert(error.message || "Đã xảy ra lỗi khi xóa cách dùng");
    }
  };

  return (
    <div className="min-h-screen w-full">
      <HeaderDashboard currentUser={user} />

      <main className="container mx-auto px-8 py-6 mt-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Regulations</h1>
        <div className="max-w-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Tab Headers */}
          <TabHeaders
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            headers={[
              "OPERATION",
              "MEDICINE",
              "DISEASE TYPE",
              "MEDICINE USAGE",
            ]}
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
                            Create
                          </button>
                        )}
                        {!isAddingMedicine && isEditingMedicine && (
                          <button
                            type="button"
                            className="bg-[#1250B1] text-white border border-blue-700 px-6 py-2 rounded hover:bg-blue-600 font-semibold w-1/10 text-center"
                            onClick={() => {
                              handleUpdate(choosedMedicine as Medicine);
                              setFetch(fetch + 1);
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
                      value={formatNumberWithThousandSeparator(examinationFee)}
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
                      // placeholder="e.g. 100"
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
                      className="w-full border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={maxMedicines}
                      onChange={(e) =>
                        handleChangeMaxMedicines(Number(e.target.value))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-600 mb-1">
                      Maximum usage instructions
                    </label>
                    <input
                      type="number"
                      className="w-full border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={maxUsageInstructions}
                      onChange={(e) =>
                        setMaxUsageInstructions(Number(e.target.value))
                      }
                    />
                  </div>
                </div>

                <button
                  className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 font-semibold mt-4"
                  onClick={() =>
                    handleSaveOperation([
                      {
                        key: "examination_fee",
                        value: examinationFee.toString(),
                      },
                      {
                        key: "max_patients_per_day",
                        value: maxPatientsPerDay.toString(),
                      },
                      {
                        key: "max_disease_types",
                        value: maxDiseaseTypes.toString(),
                      },
                      { key: "max_medicines", value: maxMedicines.toString() },
                      {
                        key: "max_usage_instructions",
                        value: maxUsageInstructions.toString(),
                      },
                    ])
                  }
                >
                  Save
                </button>
              </div>
            )}
            {activeTab === "DISEASE TYPE" && (
              <>
                <div className="mb-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                      <MedicineSearchInput
                        value={searchDiseaseType}
                        onChange={setSearchDiseaseType}
                        placeholder="Search by disease type name..."
                      />
                    </div>
                    <button
                      onClick={() => setSearchDiseaseType("")}
                      className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100 transition-colors font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <Table
                  headers={["ID", "Name", "Description"]}
                  filteredItems={presentDiseaseTypes}
                  attributesOfItem={["id", "name", "description"]}
                  weights={["w-[100px]", "w-[200px]", "w-[400px]"]}
                  handleChoose={handleChooseDiseaseType}
                  selectedItemId={choosedDiseaseType?.id || null}
                  isEditing={isEditingDiseaseType}
                />
                <div className="flex justify-between items-center mt-6">
                  <button
                    onClick={() => {
                      setIsAddingDiseaseType(!isAddingDiseaseType);
                      setChoosedDiseaseType(
                        isAddingDiseaseType
                          ? null
                          : { id: 0, name: "", description: "" }
                      );
                    }}
                    className={`px-6 py-2 rounded-md transition-colors font-medium ${
                      isAddingDiseaseType
                        ? "bg-gray-500 text-white hover:bg-gray-700"
                        : "bg-blue-500 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isAddingDiseaseType
                      ? "Cancel Creating"
                      : "Add Disease Type"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingDiseaseType(!isEditingDiseaseType);
                      if (!isEditingDiseaseType) {
                        setChoosedDiseaseType(null);
                        setIsAddingDiseaseType(false);
                      }
                    }}
                    className={`px-6 py-2 rounded-md transition-colors font-medium ${
                      isEditingDiseaseType
                        ? "bg-gray-500 text-white hover:bg-gray-700"
                        : "bg-[#1250B1] text-white hover:bg-blue-700"
                    }`}
                  >
                    {isEditingDiseaseType ? "Cancel Editing" : "Edit"}
                  </button>
                </div>
                {(choosedDiseaseType || isAddingDiseaseType) && (
                  <div className="max-w-full mx-auto bg-white p-6 rounded shadow mt-10">
                    <h2 className="text-xl font-bold text-blue-600 mb-1">
                      {isAddingDiseaseType
                        ? "Add New Disease Type"
                        : choosedDiseaseType?.name}
                    </h2>
                    <p className="text-sm text-blue-400 mb-4">
                      {!isAddingDiseaseType && choosedDiseaseType?.id && (
                        <>ID. {choosedDiseaseType.id}</>
                      )}
                    </p>
                    <form className="space-y-4">
                      <div>
                        <label className="block text-sm text-blue-600 font-semibold mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={
                            choosedDiseaseType ? choosedDiseaseType.name : ""
                          }
                          placeholder="Type here..."
                          className="w-2/3 border border-blue-300 rounded-full px-3 py-2 text-black placeholder-gray-400"
                          onChange={(e) =>
                            handleChangeDiseaseTypeAttr("name", e.target.value)
                          }
                          disabled={
                            !isAddingDiseaseType && !isEditingDiseaseType
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-blue-600 font-semibold mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={
                            choosedDiseaseType
                              ? choosedDiseaseType.description
                              : ""
                          }
                          placeholder="Type here..."
                          className="w-full border border-blue-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                          onChange={(e) =>
                            handleChangeDiseaseTypeAttr(
                              "description",
                              e.target.value
                            )
                          }
                          disabled={
                            !isAddingDiseaseType && !isEditingDiseaseType
                          }
                        />
                      </div>
                      <div className="flex justify-start gap-4 pt-2">
                        {isAddingDiseaseType && (
                          <button
                            type="button"
                            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 font-semibold w-1/10 text-center"
                            onClick={() => {
                              if (choosedDiseaseType) {
                                handleSaveDiseaseType({
                                  name: choosedDiseaseType.name,
                                  description: choosedDiseaseType.description,
                                });
                              }
                            }}
                          >
                            Create
                          </button>
                        )}
                        {!isAddingDiseaseType && isEditingDiseaseType && (
                          <button
                            type="button"
                            className="bg-[#1250B1] text-white border border-blue-700 px-6 py-2 rounded hover:bg-blue-600 font-semibold w-1/10 text-center"
                            onClick={() => {
                              if (choosedDiseaseType)
                                handleUpdateDiseaseType(choosedDiseaseType);
                            }}
                          >
                            Save
                          </button>
                        )}
                        {!isAddingDiseaseType && isEditingDiseaseType && (
                          <button
                            type="button"
                            className="bg-white text-red-500 border border-red-500 px-6 py-2 rounded hover:bg-red-200 font-semibold w-1/10 text-center"
                            onClick={() => {
                              if (choosedDiseaseType)
                                handleDeleteDiseaseType(choosedDiseaseType.id);
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
            {activeTab === "MEDICINE USAGE" && (
              <>
                <div className="mb-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                      <MedicineSearchInput
                        value={searchUsageInstruction}
                        onChange={setSearchUsageInstruction}
                        placeholder="Search by usage instruction..."
                      />
                    </div>
                    <button
                      onClick={() => setSearchUsageInstruction("")}
                      className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100 transition-colors font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <Table
                  headers={["ID", "Instruction", "Description"]}
                  filteredItems={presentUsageInstructions}
                  attributesOfItem={["id", "instruction", "description"]}
                  weights={["w-[100px]", "w-[400px]", "w-[400px]"]}
                  handleChoose={handleChooseUsageInstruction}
                  selectedItemId={choosedUsageInstruction?.id || null}
                  isEditing={isEditingUsageInstruction}
                />
                <div className="flex justify-between items-center mt-6">
                  <button
                    onClick={() => {
                      setIsAddingUsageInstruction(!isAddingUsageInstruction);
                      setChoosedUsageInstruction(
                        isAddingUsageInstruction
                          ? null
                          : { id: 0, instruction: "", description: "" }
                      );
                    }}
                    className={`px-6 py-2 rounded-md transition-colors font-medium ${
                      isAddingUsageInstruction
                        ? "bg-gray-500 text-white hover:bg-gray-700"
                        : "bg-blue-500 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isAddingUsageInstruction
                      ? "Cancel Creating"
                      : "Add Usage Instruction"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingUsageInstruction(!isEditingUsageInstruction);
                      if (!isEditingUsageInstruction) {
                        setChoosedUsageInstruction(null);
                        setIsAddingUsageInstruction(false);
                      }
                    }}
                    className={`px-6 py-2 rounded-md transition-colors font-medium ${
                      isEditingUsageInstruction
                        ? "bg-gray-500 text-white hover:bg-gray-700"
                        : "bg-[#1250B1] text-white hover:bg-blue-700"
                    }`}
                  >
                    {isEditingUsageInstruction ? "Cancel Editing" : "Edit"}
                  </button>
                </div>
                {(choosedUsageInstruction || isAddingUsageInstruction) && (
                  <div className="max-w-full mx-auto bg-white p-6 rounded shadow mt-10">
                    <h2 className="text-xl font-bold text-blue-600 mb-1">
                      {isAddingUsageInstruction
                        ? "Add New Usage Instruction"
                        : choosedUsageInstruction?.instruction}
                    </h2>
                    <p className="text-sm text-blue-400 mb-4">
                      {!isAddingUsageInstruction &&
                        choosedUsageInstruction?.id && (
                          <>ID. {choosedUsageInstruction.id}</>
                        )}
                    </p>
                    <form className="space-y-4">
                      <div>
                        <label className="block text-sm text-blue-600 font-semibold mb-1">
                          Instruction <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={
                            choosedUsageInstruction
                              ? choosedUsageInstruction.instruction
                              : ""
                          }
                          placeholder="Type here..."
                          className="w-2/3 border border-blue-300 rounded-full px-3 py-2 text-black placeholder-gray-400"
                          onChange={(e) =>
                            handleChangeUsageInstructionAttr(
                              "instruction",
                              e.target.value
                            )
                          }
                          disabled={
                            !isAddingUsageInstruction &&
                            !isEditingUsageInstruction
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-blue-600 font-semibold mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={
                            choosedUsageInstruction
                              ? choosedUsageInstruction.description
                              : ""
                          }
                          placeholder="Type here..."
                          className="w-full border border-blue-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                          onChange={(e) =>
                            handleChangeUsageInstructionAttr(
                              "description",
                              e.target.value
                            )
                          }
                          disabled={
                            !isAddingUsageInstruction &&
                            !isEditingUsageInstruction
                          }
                        />
                      </div>
                      <div className="flex justify-start gap-4 pt-2">
                        {isAddingUsageInstruction && (
                          <button
                            type="button"
                            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 font-semibold w-1/10 text-center"
                            onClick={() => {
                              if (choosedUsageInstruction) {
                                handleSaveUsageInstruction({
                                  instruction:
                                    choosedUsageInstruction.instruction,
                                  description:
                                    choosedUsageInstruction.description,
                                });
                              }
                            }}
                          >
                            Create
                          </button>
                        )}
                        {!isAddingUsageInstruction &&
                          isEditingUsageInstruction && (
                            <button
                              type="button"
                              className="bg-[#1250B1] text-white border border-blue-700 px-6 py-2 rounded hover:bg-blue-600 font-semibold w-1/10 text-center"
                              onClick={() => {
                                if (choosedUsageInstruction)
                                  handleUpdateUsageInstruction(
                                    choosedUsageInstruction
                                  );
                              }}
                            >
                              Save
                            </button>
                          )}
                        {!isAddingUsageInstruction &&
                          isEditingUsageInstruction && (
                            <button
                              type="button"
                              className="bg-white text-red-500 border border-red-500 px-6 py-2 rounded hover:bg-red-200 font-semibold w-1/10 text-center"
                              onClick={() => {
                                if (choosedUsageInstruction)
                                  handleDeleteUsageInstruction(
                                    choosedUsageInstruction.id
                                  );
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
          </div>

          <BlueUnderline />
        </div>
      </main>
    </div>
  );
}
