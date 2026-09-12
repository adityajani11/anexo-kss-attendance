import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { message } from 'antd';

const DownloadMonthlyReport = () => {
    const [barcode, setBarcode] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [years, setYears] = useState([]);
    const [, setData] = useState(null); // To hold the fetched data
    const [loading, setLoading] = useState({ pdf: false, excel: false }); // Loading state
    const token = localStorage.getItem('token'); // Token from localStorage

    useEffect(() => {
        const currentYear = new Date().getFullYear();
        const pastYears = Array.from({ length: 6 }, (_, i) => currentYear - i);
        setYears(pastYears);
    }, []);

    const handleDownload = async (type) => {
        if (!barcode || !year || !month) {
            Swal.fire('Error', 'Please fill all the fields.', 'error');
            return;
        }

        setLoading({ pdf: type === 'pdf', excel: type === 'excel' }); // Set loading state to true

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/attendance/monthly`,
                { barcode, year, month },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const fetchedData = response.data;
            setData(fetchedData);

            if (fetchedData.details.length === 0) {
                Swal.fire('No Data Found', 'No attendance records found.', 'info');
                return;
            }

            if (type === 'pdf') {
                generatePDF(fetchedData.details);
            } else if (type === 'excel') {
                generateExcel(fetchedData.details);
            }
        } catch (error) {
            Swal.fire('Error', 'Failed to fetch or download report. Please try again.', 'error');
        } finally {
            setLoading({ pdf: false, excel: false }); // Reset loading state
        }
    };

    const generatePDF = (details) => {
        Swal.fire({
            title: 'Confirm Download',
            text: "Are you sure you want to download the monthly attendance report PDF?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, download it!',
            cancelButtonText: 'No, cancel!',
        }).then((result) => {
            if (result.isConfirmed) {
                const doc = new jsPDF();
                doc.text('Monthly Attendance Report', 14, 20);

                const totalPresent = details.filter(item => item.status === 'PRESENT').length;
                const totalAbsent = details.filter(item => item.status === 'ABSENT').length;

                doc.setFontSize(12);
                doc.text(`Total Present: ${totalPresent}`, 14, 28);
                doc.text(`Total Absent: ${totalAbsent}`, 14, 34);

                const formatTime = (timestamp) => {
                    const date = new Date(timestamp.replace("Z", ""));
                    return date.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                    });
                };

                const getDayName = (dateString) => {
                    const date = new Date(dateString);
                    return date.toLocaleDateString('en-GB', { weekday: 'long' });
                };

                doc.autoTable({
                    startY: 40,
                    head: [['Roll Number', 'Date', 'Day', 'Status', 'Timestamp']],
                    body: details.map((item) => [
                        barcode,
                        new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                        getDayName(item.date),
                        item.status,
                        formatTime(item.timestamp)
                    ]),
                });

                doc.save(`Attendance_Report_${barcode}_${month}_${year}.pdf`);
                message.success("PDF downloaded successfully.");
            } else {
                message.info("PDF download was canceled.");
            }
        });
    };

    const generateExcel = (details) => {
        Swal.fire({
            title: 'Confirm Download',
            text: "Are you sure you want to download the monthly attendance report Excel?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, download it!',
            cancelButtonText: 'No, cancel!',
        }).then((result) => {
            if (result.isConfirmed) {
                const formatTime = (timestamp) => {
                    const date = new Date(timestamp.replace("Z", ""));
                    return date.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                    });
                };

                const getDayName = (dateString) => {
                    const date = new Date(dateString);
                    return date.toLocaleDateString('en-GB', { weekday: 'long' });
                };

                const totalPresent = details.filter(item => item.status === 'PRESENT').length;
                const totalAbsent = details.filter(item => item.status === 'ABSENT').length;

                const data = [
                    ['Monthly Attendance Report'],
                    [`Total Present: ${totalPresent}`, `Total Absent: ${totalAbsent}`],
                    [],
                    ['Roll Number', 'Date', 'Day', 'Status', 'Timestamp'],
                    ...details.map((item) => [
                        barcode,
                        new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                        getDayName(item.date),
                        item.status,
                        formatTime(item.timestamp)
                    ])
                ];

                const worksheet = XLSX.utils.aoa_to_sheet(data);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');
                XLSX.writeFile(workbook, `Attendance_Report_${barcode}_${year}_${month}.xlsx`);
                message.success("Excel downloaded successfully.");
            } else {
                message.info("Excel download was canceled.");
            }
        });
    };

    return (
        <div className="container mt-3 bg-light rounded p-3">
            <h5 className="alert text-center alert-primary">
                <strong>Student Monthly Attendance Report!</strong>
            </h5>
            <div className="row">
                <div className="form-group col-md-4">
                    <label htmlFor="barcode" className="form-label">
                        <i className="fa fa-barcode me-2"></i><strong>Enter Barcode [Roll Number]:</strong>
                    </label>
                    <input
                        type="text"
                        id="barcode"
                        className="form-control"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value.toUpperCase())}
                        placeholder="Enter Roll Number"
                        maxLength="10"
                    />
                </div>
                <div className="form-group col-md-4">
                    <label htmlFor="month" className="form-label">
                        <i className="fa fa-calendar-alt me-2"></i><strong>Select Month:</strong>
                    </label>
                    <select
                        className="form-select"
                        id="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((mn) => (
                            <option key={mn} value={mn}>
                                {new Date(0, mn - 1).toLocaleString("default", { month: "long" })}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group col-md-4">
                    <label htmlFor="year" className="form-label">
                        <i className='fa fa-calendar-check me-2'></i><strong>Select Year:</strong>
                    </label>
                    <select
                        className="form-select"
                        id="year"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                    >
                        {years.map((yr) => (
                            <option key={yr} value={yr}>{yr}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="d-flex justify-content-center mt-4">
                <button
                    className="btn btn-success me-2"
                    onClick={() => handleDownload('excel')}
                    disabled={loading.pdf || loading.excel}
                >
                    {loading.excel ? (
                        <i className="fas fa-spinner fa-spin me-2"></i>
                    ) : (
                        <i className="fa fa-file-excel me-2"></i>
                    )}
                    Download Excel
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={() => handleDownload('pdf')}
                    disabled={loading.pdf || loading.excel}
                >
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

export default DownloadMonthlyReport;
