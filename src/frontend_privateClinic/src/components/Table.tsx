import { useEffect, useRef, useState } from "react";

export default function Table({
  headers,
  filteredItems,
  attributesOfItem,
  handleChoose = (id: number) => {
    id;
  },
  weights = [],
  selectedItemId = null,
  isEditing = false,
}: {
  headers: string[];
  filteredItems: any[];
  attributesOfItem: string[];
  handleChoose?: (id: number) => void;
  weights: string[];
  selectedItemId?: number | null;
  isEditing?: boolean;
}) {
  const table_fixed = weights.length === 0 ? "table-fixed" : "";
  const _weights =
    weights.length === 0 ? Array(headers.length + 1).fill("") : weights;

  const headerRef = useRef<HTMLTableSectionElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, []);

  return (
    <div className="relative">
      {/* Table header đè lên */}
      <div className="absolute top-0 left-0 right-0 z-1">
        <table className={"w-full rounded-t-xl overflow-hidden " + table_fixed}>
          <thead ref={headerRef} className="bg-[#1250B1] text-white h-[50px]">
            <tr>
              <th className={"px-4 py-3 text-left " + _weights[0]}>No.</th>
              {headers.map((header, index) => (
                <th
                  className={
                    "px-4 py-3 font-bold text-left " + _weights[index + 1]
                  }
                  key={index}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>

      {/* Tô nền khớp chiều cao header */}
      <div
        style={{ height: headerHeight - 15, backgroundColor: "white" }} // bg-blue-400
      ></div>

      {/* Table nội dung có scroll */}
      <div className="max-h-96 overflow-y-auto">
        <table className={"w-full rounded-t-xl overflow-hidden " + table_fixed}>
          <thead className="opacity-0 pointer-events-none select-none h-[0px]">
            <tr>
              <th className={_weights[0]}>No.</th>
              {headers.map((header, index) => (
                <th className={_weights[index + 1]} key={index}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {filteredItems.map((item, index) => (
              <tr
                key={item.id}
                className={`transition ${
                  isEditing ? "cursor-pointer" : "cursor-default"
                } ${selectedItemId === item.id ? "bg-blue-100" : ""} ${
                  isEditing ? "hover:bg-gray-200" : "hover:bg-gray-100"
                }`}
                onClick={() => handleChoose(item.id)}
              >
                <td className={"px-4 py-3 text-gray-900 " + _weights[0]}>
                  {index + 1}
                </td>
                {attributesOfItem.map((attr, i) => (
                  <td
                    className={"px-4 py-3 text-gray-900 " + _weights[i + 1]}
                    key={i}
                  >
                    {item[attr]}
                  </td>
                ))}
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td
                  colSpan={headers.length + 1}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No items found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
