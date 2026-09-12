import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { message } from 'antd';

const DownloadAllAttendance = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [standard, setStandard] = useState("ALL");
    const [gender, setGender] = useState("ALL");
    const [years, setYears] = useState([]);
    const [loading, setLoading] = useState({ pdf: false, excel: false }); // Loading state
    const [, setData] = useState(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const currentYear = new Date().getFullYear();
        setYears(Array.from({ length: 6 }, (_, i) => currentYear - i));
    }, []);

    const fetchAttendanceData = async () => {
        try {
            const numericStandard = standard === "ALL" ? "ALL" : Number(standard); // Convert standard to a number, but keep "ALL" as a string
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/attendance/get/all-attendance`,
                { month, year, standard: numericStandard, gender },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setData(response.data);
            return response.data;
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Data Not Found.', 'error');
            setLoading({ pdf: false, excel: false })
        }
    };

    const generatePDF = async () => {
        setLoading({ pdf: true });
        const fetchedData = await fetchAttendanceData();
        if (!fetchedData || !fetchedData.muster) return;

        const doc = new jsPDF({ orientation: 'landscape' });
        doc.text(`Attendance Muster - ${month}/${year}`, 14, 15);
        doc.text(`Standard: ${standard}, Gender: ${gender}`, 14, 25);

        const daysInMonth = new Date(year, month, 0).getDate();

        // Create date and short day name array for each date
        const dateAndDay = Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const date = new Date(year, month - 1, day);
            const dayName = date.toLocaleString('default', { weekday: 'short' }); // Short day name (Mon, Tue, etc.)
            return { date: day, day: dayName };
        });

        // Table header with both date and day name in separate rows
        const tableHeadDate = [
            'Barcode',
            ...dateAndDay.map(item => item.date) // Only the dates in the first row
        ];

        const tableHeadDay = [
            '',
            ...dateAndDay.map(item => item.day) // Only the day names in the second row
        ];

        // Sort barcodes numerically using localeCompare with numeric option
        const sortedBarcodes = Object.entries(fetchedData.muster).sort(([barcodeA], [barcodeB]) =>
            barcodeA.localeCompare(barcodeB, undefined, { numeric: true, sensitivity: 'base' })
        );

        // Prepare table body after sorting
        const tableBody = sortedBarcodes.map(([barcode, attendance]) => [
            barcode,
            ...Array.from({ length: daysInMonth }, (_, i) => attendance[String(i + 1).padStart(2, "0")] || '-')
        ]);

        // Draw the table with two header rows (Date and Day)
        doc.autoTable({
            startY: 30,
            head: [tableHeadDate, tableHeadDay], // First row for dates, second for day names
            body: tableBody,
            styles: { fontSize: 7, cellWidth: 'auto' },
            didParseCell: function (data) {
                if (data.row.index >= 0 && data.column.index > 0) { // Ignore headers and barcode column
                    if (data.cell.raw === 'A') {
                        data.cell.styles.textColor = [255, 0, 0]; // Red color for "A"
                    } else if (data.cell.raw === 'P') {
                        data.cell.styles.fontStyle = 'bold'; // Bold for "P"
                    }
                }
            }
        });

        await Swal.fire({
            title: "Confirm Download",
            text: "Do you want to download the PDF?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, download it!",
            cancelButtonText: "No, cancel!",
        }).then((result) => {
            if (result.isConfirmed) {
                doc.save(`Attendance_Muster_${month}_${year}.pdf`);
                message.success("PDF downloaded successfully.");
            } else {
                message.info("PDF download was cancelled.");
            }
        }).finally(
            setLoading({ pdf: false })
        );
        setLoading({ pdf: false });
    };


    const generateExcel = async () => {
        setLoading({ excel: true });
        const fetchedData = await fetchAttendanceData();
        if (!fetchedData || !fetchedData.muster) return;

        const daysInMonth = new Date(year, month, 0).getDate();
        const tableHead = ['Barcode', ...Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString().padStart(2, "0"))];

        // Sort barcodes numerically using localeCompare
        const sortedBarcodes = Object.entries(fetchedData.muster).sort(([barcodeA], [barcodeB]) =>
            barcodeA.localeCompare(barcodeB, undefined, { numeric: true, sensitivity: 'base' })
        );

        // Prepare table body after sorting
        const tableBody = sortedBarcodes.map(([barcode, attendance]) => [
            barcode,
            ...Array.from({ length: daysInMonth }, (_, i) => attendance[String(i + 1).padStart(2, "0")] || '-')
        ]);

        const worksheet = XLSX.utils.aoa_to_sheet([tableHead, ...tableBody]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Muster');

        await Swal.fire({
            title: "Confirm Download",
            text: "Do you want to download the Excel?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, download it!",
            cancelButtonText: "No, cancel!",
        }).then((result) => {
            if (result.isConfirmed) {
                XLSX.writeFile(workbook, `Attendance_Muster_${month}_${year}.xlsx`);
                message.success("Excel downloaded successfully.");
            } else {
                message.info("Excel download was cancelled.");
            }
        }).finally(
            setLoading({ excel: false })
        );
    };


    return (
        <div className="container bg-light rounded p-3">
            <h5 className="alert text-center alert-primary"><strong>Monthly Attendance Muster</strong></h5>
            <div className="row">
                <div className="form-group col-md-3">
                    <label htmlFor="selectMonth" className="form-label">
                        <i className="fa fa-calendar-alt me-2"></i><strong>Select Month:</strong>
                    </label>
                    <select id="selectMonth" className="form-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{new Date(0, m - 1).toLocaleString("default", { month: "long" })}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group col-md-3">
                    <label htmlFor="selectYear" className="form-label">
                        <i className='fa fa-calendar-check me-2'></i><strong>Select Year:</strong>
                    </label>
                    <select id="selectYear" className="form-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                        {years.map(y => (<option key={y} value={y}>{y}</option>))}
                    </select>
                </div>
                <div className="form-group col-md-3">
                    <label htmlFor="selectStandard" className="form-label">
                        <i className="fas fa-users me-2"></i><strong>Select Standard:</strong>
                    </label>
                    <select id="selectStandard" className="form-select" value={standard} onChange={(e) => setStandard(e.target.value)}>
                        <option value="ALL">ALL</option>
                        <option value="9">9</option>
                        <option value="10">10</option>
                    </select>
                </div>
                <div className="form-group col-md-3">
                    <label htmlFor="selectGender" className="form-label">
                        <i className="fas fa-genderless me-2"></i><strong>Select Gender:</strong>
                    </label>
                    <select id="selectGender" className="form-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="ALL">ALL</option>
                        <option value="Male">BOYS</option>
                        <option value="Female">GIRLS</option>
                        <option value="Other">OTHER</option>
                    </select>
                </div>
            </div>
            <div className="d-flex justify-content-center mt-4">
                <button className="btn btn-success me-2"
                    onClick={generateExcel}
                    disabled={loading.pdf || loading.excel} >
                    {loading.excel ? (
                        <i className="fas fa-spinner fa-spin me-2"></i>
                    ) : (
                        <i className="fa fa-file-excel me-2"></i>
                    )}
                    Download Excel
                </button>
                <button className="btn btn-secondary"
                    onClick={generatePDF}
                    disabled={loading.pdf || loading.excel} >
                    {loading.pdf ? (
                        <i className="fas fa-spinner fa-spin me-2"></i>
                    ) : (
                        <i className="fa fa-file-pdf me-2"></i>
                    )}
                    Download PDF
                </button>
            </div>
        </div>
    );
};

export default DownloadAllAttendance;
