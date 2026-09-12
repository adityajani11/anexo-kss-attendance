import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../style/CustomCalendar.css";
import ".././loader.css";

const localizer = momentLocalizer(moment);

const CalendarView = () => {
    const { barcode } = useParams();
    const navigate = useNavigate();
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refetch, setRefetch] = useState(false); // State to trigger refetch

    useEffect(() => {
        const fetchAttendance = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/attendance/${barcode}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        },
                    }
                );

                const formattedAttendance = response.data.attendance.map((item) => ({
                    id: item._id,
                    title: item.status,
                    start: new Date(item.timestamp.replace("T", " ").replace("Z", "").replace(/\.\d+$/, "")),
                    end: new Date(item.timestamp.replace("T", " ").replace("Z", "").replace(/\.\d+$/, "")),
                    status: item.status,
                    barcode,
                    timestamp: item.timestamp,
                }));

                setAttendance(formattedAttendance);
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    Swal.fire("Session Expired", "Please log in again", "error");
                    localStorage.removeItem("token");
                    navigate("/");
                } else {
                    setError("Failed to fetch attendance. Please try again.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [barcode, refetch, navigate]); // Add refetch to dependencies

    const updateAttendance = async (barcode, date, status) => {
        try {
            await axios.post(
                `${process.env.REACT_APP_API_URL}/api/attendance/updateAttendance`,
                { barcode, date, status },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                }
            ).then((response) => {
                Swal.fire("Success", response.data.message || "Attendance updated successfully!", "success");
                setRefetch((prev) => !prev); // Trigger refetch after successful update

            });

        } catch (error) {
            if (error.response.status === 422) {
                Swal.fire("Warning", error.response?.data?.message || "Failed to update attendance.", "warning");

            }
            else {
                console.error("Error updating attendance:", error);
                Swal.fire("Error", error.response?.data?.message || "Failed to update attendance.", "error");
            }

        }
    };

    const onSelectEvent = (event) => {
        const formattedDate = new Intl.DateTimeFormat("en-US", {
            month: "long",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
        }).format(event.start);

        Swal.fire({
            title: "Attendance Details",
            html: `<strong>Date:</strong> ${formattedDate}<br/><strong>Status:</strong> ${event.title}`,
            icon: "info",
            allowOutsideClick: false,
            showCancelButton: true,
            confirmButtonText: "Update",
            cancelButtonText: "Close",
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: "Update Attendance",
                    input: "select",
                    inputOptions: {
                        PRESENT: "PRESENT",
                        ABSENT: "ABSENT",
                    },
                    inputPlaceholder: "Select new status",
                    showCancelButton: true,
                    allowOutsideClick: false,
                    confirmButtonText: "Submit",
                    cancelButtonText: "Cancel",
                }).then((updateResult) => {
                    if (updateResult.isConfirmed) {
                        const newStatus = updateResult.value;
                        const localDate = new Date(event.start);
                        localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
                        const formattedDate = localDate.toISOString().split("T")[0];
                        updateAttendance(event.barcode, formattedDate, newStatus);
                    }
                });
            }
        });
    };


    if (loading) {
        return (
            <div className="loader-container">
                <div className="loader"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container text-center">
                {barcode.length !== 10 ? <h5 className="text-center alert alert-danger m-2 mb-3" role="alert">
                    <strong>Please enter valid Barcode!</strong>
                </h5> : <h5 className="text-center alert alert-danger m-2 mb-3" role="alert">
                    <strong>{error}</strong>
                </h5>}

                <button className="btn btn-primary mt-3" onClick={() => navigate("/students/report")}>
                    Back to Form
                </button>
            </div>
        );
    }

    return (
        <div className="container">
            <h5 className="text-center alert alert-primary m-2 mb-3" role="alert">
                <strong>STUDENT ATTENDANCE REPORT - {barcode}</strong>
            </h5>
            <div className="calendar-container">
                <Calendar
                    style={{ height: 500 }}
                    localizer={localizer}
                    events={attendance}
                    startAccessor="start"
                    endAccessor="end"
                    eventPropGetter={(event) => ({
                        style: {
                            backgroundColor:
                                event.title === "PRESENT"
                                    ? "#28a745"
                                    : event.title === "ABSENT"
                                        ? "#dc3545"
                                        : "#ffc107",
                            color: "white",
                            borderRadius: "4px",
                            padding: "5px",
                            fontWeight: "bold",
                        },
                    })}
                    views={["month"]}
                    defaultView="month"
                    onSelectEvent={onSelectEvent}
                />
            </div>
            <div className="mt-3 d-flex justify-content-between mb-2">
                <button className="btn btn-secondary" onClick={() => navigate("/students/report")}>
                    Back
                </button>
            </div>
        </div>
    );
};
export default CalendarView;
