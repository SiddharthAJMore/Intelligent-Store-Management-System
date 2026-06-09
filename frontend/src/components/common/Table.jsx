import React from 'react'

export default function Table({ headers, rows, renderRow, emptyMessage = 'No data found.' }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-200">
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows && rows.length > 0 ? (
            rows.map((row, i) => (
              <tr
                key={i}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                {renderRow(row, i)}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={headers.length}
                className="px-4 py-10 text-center text-gray-400 italic"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
