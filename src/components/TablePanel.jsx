// components/TablePanel.jsx
import React from 'react';

const TablePanel = ({
  rows,
  updateCell,
  downloadDocx,
  downloadPDF,
  loading
}) => {
  return (
    <div className="w-full min-h-60 lg:w-1/2 p-2 sm:p-4 overflow-y-auto overflow-x-hidden border-b lg:border-b-0 lg:border-l">
      <div className="flex justify-between items-center mb-2 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-bold">جدول خطة الحفظ</h2>
        <div className="flex gap-1 sm:gap-2">
          <button
            style={{ backgroundColor: "black" }}
            className="bg-green-600 text-white text-[5px] px-2 sm:px-4 py-1 sm:py-2 rounded sm:text-base hover:bg-green-700 flex items-center gap-1 sm:gap-2 hover:scale-105 transition-transform duration-200"
            onClick={downloadDocx}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="inline-block w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span className="text-xs">جاري المعالجة...</span> 
              </>
            ) : (
              "تحميل DOCX"
            )}
          </button>
          <button
            style={{ backgroundColor: "black" }}
            className="text-white px-2 sm:px-4 py-1 sm:py-2 rounded text-xs sm:text-base hover:bg-red-700 flex items-center gap-1 sm:gap-2 hover:scale-105 transition-transform duration-200"
            onClick={downloadPDF}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="inline-block w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span className="text-xs">جاري المعالجة...</span> 
              </>
            ) : (
              "تحميل PDF"
            )}
          </button>
        </div>
      </div>
      <div className="overflow-auto max-h-[calc(50vh-6rem)] lg:max-h-[calc(100vh-12rem)]">
        <table className="w-full table-auto border border-gray-300">
          <thead className="sticky top-0 bg-white">
            <tr className="bg-gray-200">
              {rows[0]?.map((header, colIndex) => (
                <th key={colIndex} className="border p-1 sm:p-2 text-center font-bold text-xs sm:text-base">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(1).map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-gray-50" : ""}>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="border p-1 sm:p-2 text-xs sm:text-base">
                    {colIndex === 4 ? (
                      <select
                        onChange={(e) => updateCell(rowIndex + 1, colIndex, e.target.value)}
                        className="w-full border-none focus:outline-none bg-transparent text-center text-xs sm:text-base"
                        value={cell}
                      >
                        <option value="">اختر نوع التسميع</option>
                        <option value="مراجعة ذاتية">مراجعة ذاتية</option>
                        <option value="اتصال">اتصال</option>
                        <option value="اختبار">اختبار</option>
                      </select>
                    ) : (
                      <input
                        value={cell}
                        onChange={(e) => updateCell(rowIndex + 1, colIndex, e.target.value)}
                        className="w-full border-none focus:outline-none bg-transparent text-center text-xs sm:text-base"
                        placeholder={`خانة ${rowIndex + 1},${colIndex}`}
                        readOnly={colIndex < 2} // Make date and day columns read-only
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablePanel;