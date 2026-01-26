import React from "react";
import * as XLSX from "xlsx";
import { Button } from "./Button";
import "./DynamicTable.css";

interface DynamicTableProps {
  data: Array<Record<string, any>>;
}

export const DynamicTable: React.FC<DynamicTableProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return null;
  }

  const headers = Object.keys(data[0]);

  const handleExport = () => {
    // timestamp for unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `report_data_${timestamp}.xlsx`;

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="dynamic-table-container">
      <div className="dynamic-table-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        <Button onClick={handleExport} variant="social" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          📤 Export to Excel
        </Button>
      </div>
      <table className="dynamic-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {headers.map((header, colIndex) => (
                <td key={`${rowIndex}-${colIndex}`}>
                  {row[header] !== null && row[header] !== undefined
                    ? String(row[header])
                    : "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
