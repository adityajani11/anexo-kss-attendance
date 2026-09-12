import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { message } from "antd";
import DownloadMonthlyReport from "./DownloadMonthlyReport";
import DownloadAllAttendance from "./DownloadAllAttendance";

const DownloadAttendance = () => {
  const [std, setStd] = useState("ALL");
  const [gender, setGender] = useState("ALL");
  const [status, setStatus] = useState("PRESENT");
  const [isLoading, setIsLoading] = useState({ pdf: false, excel: false });

  // Format timestamp AM/PM
  const formatTime = (timestamp) => {
    const [, timePart] = timestamp.split('T'); // Split the timestamp at T
    const [time,] = timePart.split('.'); // Split time and milliseconds
    const [hours, minutes, seconds] = time.split(':'); // Extract time parts

    const amPm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    const formattedHours = parseInt(hours) % 12 || 12; // Convert 0 to 12 for AM/PM
    return `${formattedHours}:${minutes}:${seconds} ${amPm}`;
  };

  const handleDownloadPDF = async () => {
    setIsLoading((prev) => ({ ...prev, pdf: true }));
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/attendance/getAttendanceData`,
        {
          std: std === "ALL" ? "ALL" : std,
          gender: gender === "ALL" ? "ALL" : gender,
          status,
        } ,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      const { attendanceData } = response.data;

      if (!attendanceData || attendanceData.length === 0) {
        Swal.fire("No Data", "No attendance data found for the provided criteria.", "info");
        return;
      }

      // Optimized Barcode Sorting
      const sortedData = attendanceData.slice().sort((a, b) =>
        a.barcode.localeCompare(b.barcode, undefined, { numeric: true, sensitivity: 'base' })
      );

      const formattedData = sortedData.map((item, index) => [
        index + 1,
        item.barcode,
        item.name,
        item.contactNumber,
        item.city,
        item.class,
        item.gender,
        formatTime(item.timestamp),
      ]);

      const doc = new jsPDF({ orientation: "landscape" });

      doc.text(`${status} Attendance`, 13, 14);
      doc.autoTable({
        head: [["SR. NO", "ROLL NUMBER", "STUDENT NAME", "CONTACT", "CITY", "CLASS", "GENDER", "TIMESTAMP"]],
        body: formattedData,
        startY: 20,
      });

      const result = await Swal.fire({
        title: "Confirm Download",
        text: "Do you want to download the PDF?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, download it!",
        cancelButtonText: "No, cancel!",
      });

      if (result.isConfirmed) {
        doc.save(`${status} Attendance.pdf`);
        message.success("PDF downloaded successfully.");
      } else {
        message.info("PDF download was cancelled.");
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading((prev) => ({ ...prev, pdf: false }));
    }
  };

  const handleDownloadExcel = async () => {
    setIsLoading((prev) => ({ ...prev, excel: true }));
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/attendance/getAttendanceData`,
        {
          std: std === "ALL" ? "ALL" : std,
          gender: gender === "ALL" ? "ALL" : gender,
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      const { attendanceData } = response.data;

      if (!attendanceData || attendanceData.length === 0) {
        Swal.fire("No Data", "No attendance data found for the provided criteria.", "info");
        return;
      }

      // Optimized Barcode Sorting
      const sortedData = attendanceData.slice().sort((a, b) =>
        a.barcode.localeCompare(b.barcode, undefined, { numeric: true, sensitivity: 'base' })
      );

      const formattedData = sortedData.map((item, index) => ({
        "SR. NO": index + 1,
        "ROLL NUMBER": item.barcode,
        "STUDENT NAME": item.name,
        CONTACT: item.contactNumber,
        CITY: item.city,
        CLASS: item.class,
        GENDER: item.gender,
        TIMESTAMP: formatTime(item.timestamp),
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Data");

      const result = await Swal.fire({
        title: "Confirm Download",
        text: "Do you want to download the Excel?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, download it!",
        cancelButtonText: "No, cancel!",
      });

      if (result.isConfirmed) {
        XLSX.writeFile(workbook, `${status} Attendance.xlsx`);
        message.success("Excel downloaded successfully.");
      } else {
        message.info("Excel download was cancelled.");
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading((prev) => ({ ...prev, excel: false }));
    }
  };


  const handleApiError = (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 400) {
        Swal.fire("Validation Error", data.error, "error");
      } else if (status === 404) {
        Swal.fire("Data Not Found", data.message, "info");
      } else {
        Swal.fire("Error", data.error || "An unexpected error occurred.", "error");
      }
    } else {
      Swal.fire("Error", "Unable to connect to the server. Please try again later.", "error");
    }
  };

  return (
    <>
      <div className="container mt-2">
        <h5 className="alert text-center alert-primary" role="alert">
          <strong>Download Today's Attendance!</strong>
        </h5>
        <div className="row">
          <div className="col-md-4">
            <div className="mb-3">
              <label className="form-label" htmlFor="class">
                <i className="fas fa-users me-2"></i><strong>Select Standard:</strong>
              </label>
              <select className="form-select" id="class" value={std} onChange={(e) => setStd(e.target.value)}>
                <option value="ALL">ALL</option>
                <option value="9">9</option>
                <option value="10">10</option>
              </select>
            </div>
          </div>

          <div className="col-md-4">
            <div className="mb-3">
              <label className="form-label" htmlFor="gender">
                <i className="fas fa-genderless me-2"></i><strong>Select Gender:</strong>
              </label>
              <select className="form-select" id="gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="ALL">ALL</option>
                <option value="Male">BOYS</option>
                <option value="Female">GIRLS</option>
                <option value="Other">OTHER</option>
              </select>
            </div>
          </div>

          <div className="col-md-4">
            <div className="mb-3">
              <label className="form-label" htmlFor="status">
                <i className="fas fa-check-circle me-2"></i><strong>Select Status:</strong>
              </label>
              <select className="form-select" id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="PRESENT">PRESENT</option>
                <option value="ABSENT">ABSENT</option>
              </select>
            </div>
          </div>
        </div>
        <div className="d-flex justify-content-center mt-2 mb-2">
          <button
            className="btn btn-success me-2"
            onClick={handleDownloadExcel}
            disabled={isLoading.pdf || isLoading.excel}
          >
            {isLoading.excel ? (
              <i className="fas fa-spinner fa-spin me-2"></i>
            ) : (
              <i className="fas fa-file-excel me-2"></i>
            )}
            Download Excel
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleDownloadPDF}
            disabled={isLoading.pdf || isLoading.excel}
          >
            {isLoading.pdf ? (
              <i className="fas fa-spinner fa-spin me-2"></i>
            ) : (
              <i className="fas fa-file-pdf me-2"></i>
            )}
            Download PDF
          </button>
        </div>
      </div>
      <DownloadMonthlyReport />
      <DownloadAllAttendance />
    </>
  );
};

export default DownloadAttendance;