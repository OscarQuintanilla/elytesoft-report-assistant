import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "./Button";
import "./DynamicTable.css";

interface DynamicTableProps {
  data: Array<Record<string, any>>;
  defaultPageSize?: number;
}

export const DynamicTable: React.FC<DynamicTableProps> = ({
  data,
  defaultPageSize = 10,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  if (!data || data.length === 0) {
    return null;
  }

  const headers = Object.keys(data[0]);
  const totalRows = data.length;
  const totalPages = Math.ceil(totalRows / pageSize);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRows);
  const currentRows = data.slice(startIndex, endIndex);

  const handleExport = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `report_data_${timestamp}.xlsx`;
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, filename);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Build page number buttons (show at most 5 pages around the current)
  const getPageNumbers = () => {
    const delta = 2;
    const range: number[] = [];
    for (
      let i = Math.max(1, currentPage - delta);
      i <= Math.min(totalPages, currentPage + delta);
      i++
    ) {
      range.push(i);
    }
    return range;
  };

  return (
    <div className="dynamic-table-container">
      {/* Top bar */}
      <div className="dynamic-table-actions">
        <div className="dynamic-table-page-size">
          <label>Rows per page:</label>
          <select value={pageSize} onChange={handlePageSizeChange}>
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <Button
          onClick={handleExport}
          variant="social"
          style={{ padding: "8px 16px", fontSize: "0.9rem" }}
        >
          📤 Export to Excel
        </Button>
      </div>

      {/* Table */}
      <table className="dynamic-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentRows.map((row, rowIndex) => (
            <tr key={startIndex + rowIndex}>
              {headers.map((header, colIndex) => (
                <td key={`${startIndex + rowIndex}-${colIndex}`}>
                  {row[header] !== null && row[header] !== undefined
                    ? String(row[header])
                    : "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination controls */}
      <div className="dynamic-table-pagination">
        <span className="pagination-info">
          {startIndex + 1}–{endIndex} of {totalRows} rows
        </span>

        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            title="First page"
          >
            «
          </button>
          <button
            className="pagination-btn"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            title="Previous page"
          >
            ‹
          </button>

          {getPageNumbers().map((page) => (
            <button
              key={page}
              className={`pagination-btn${page === currentPage ? " active" : ""}`}
              onClick={() => goToPage(page)}
            >
              {page}
            </button>
          ))}

          <button
            className="pagination-btn"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="Next page"
          >
            ›
          </button>
          <button
            className="pagination-btn"
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            title="Last page"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
};
