export default function Table({
  headers,
  filteredItems,
  attributesOfItem,
  handleChoose = (id: number) => {
    id;
  },
}: {
  headers: string[];
  filteredItems: object[];
  attributesOfItem: string[];
  handleChoose?: (id: number) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full table-fixed">
        <thead className="bg-blue-400 text-white">
          <tr>
            <th className="px-4 py-3 text-center font-bold w-1/5" key={"no."}>
              No.
            </th>
            {headers.map((header, index) => {
              return (
                <th
                  className="px-4 py-3 text-center font-bold w-1/5"
                  key={index}
                >
                  {header}
                </th>
              );
            })}
          </tr>
        </thead>
      </table>

      <div className="max-h-96 overflow-y-auto">
        <table className="w-full table-fixed border border-blue-500">
          <tbody className="divide-y divide-gray-200">
            {filteredItems.map((item, index) => (
              <tr
                key={item.id}
                className="hover:bg-gray-50 hover:bg-gray-100 cursor-pointer transition"
                onClick={() => {
                  handleChoose(item.id);
                }}
              >
                <td className="px-4 py-3 text-center text-gray-900 border border-blue-500">
                  {index + 1}
                </td>
                {attributesOfItem.map((attr, i) => {
                  return (
                    <td
                      className="px-4 py-3 text-center text-gray-900 border border-blue-500"
                      key={i}
                    >
                      {item[attr]}
                    </td>
                  );
                })}
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
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
