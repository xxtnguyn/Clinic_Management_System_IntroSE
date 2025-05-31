interface TableProps<T extends Record<string, any>> {
  headers: string[];
  filteredItems: T[];
  attributesOfItem: (keyof T)[];
}

export default function Table<T extends Record<string, any>>({
  headers,
  filteredItems,
  attributesOfItem,
}: TableProps<T>) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="max-h-96 overflow-y-auto">
        <table className="w-full table-fixed">
          <thead className="bg-blue-500 text-white sticky top-0">
            <tr>
              {headers.map((header, index) => (
                <th
                  className="px-4 py-3 text-center font-medium"
                  style={{ width: `${100 / headers.length}%` }}
                  key={`header-${index}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredItems.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No items found
                </td>
              </tr>
            ) : (
              filteredItems.map((item, index) => (
                <tr
                  key={`row-${index}-${item[attributesOfItem[0]]}`}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-gray-900 text-center">
                    {index + 1}
                  </td>
                  {attributesOfItem.slice(1).map((attr, i) => (
                    <td
                      className="px-4 py-3 text-gray-900"
                      key={`cell-${index}-${i}`}
                    >
                      {item[attr]?.toString() || ""}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
