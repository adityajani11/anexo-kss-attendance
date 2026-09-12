import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { message, notification } from "antd"; // Import message from Ant Design
import { getAdminContact, generateOtp, sendOtp, verifyOtp, verifyVerificationPassword } from "../../Utils/utils";

const DeleteDatabase = () => {
    const [step, setStep] = useState(1);
    const [verificationPassword, setVerificationPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [isConfirmed, setIsConfirmed] = useState(false); // State for checkbox
    const [deleteClass, setDeleteClass] = useState(""); // State to track class to delete
    const [loading, setLoading] = useState(false); // Loading state for spinner
    const navigate = useNavigate();

    const jwtToken = localStorage.getItem("token"); // Get the token
    const adminId = localStorage.getItem("adminId"); // Get logged-in admin ID

    const handleCancel = () => {
        message.info("Operation Cancelled"); // Show Ant Design message
        navigate("/admin/dashboard");
    };

    // Admin password verification handler
    const handlePasswordVerification = async (e) => {
        e.preventDefault(); // Prevent form submission
        setLoading(true); // Show loading spinner

        try {
            const verificationResponse = await verifyVerificationPassword(adminId, verificationPassword, jwtToken);

            if (verificationResponse.success) {
                const otp = generateOtp(); // Generate OTP
                const receiver = await getAdminContact();

                // Call the utility function to send OTP
                await sendOtp(receiver, otp)
                    .then(response => {
                        // OTP successfully sent
                        Swal.fire("OTP Sent", "An OTP has been sent to your registered contact via WhatsApp. Please check to proceed.", "success");
                        setStep(2); // Move to OTP verification step
                    })
                    .catch(error => {
                        // Error occurred while sending OTP
                        Swal.fire("Error", error.message || "Failed to send OTP. Please try again.", "error");
                    });

            } else {
                Swal.fire("Error", verificationResponse.message || "Invalid password or some error occurred. Please try again.", "error");
                setVerificationPassword(""); // Clear the password input
            }
        } catch (error) {
            // Improved error handling with proper messages
            const errorMessage = error.response?.data?.message || error.message || "An error occurred. Please try again.";
            Swal.fire("Error", errorMessage, "error");
            setVerificationPassword(""); // Clear the password input
        } finally {
            setLoading(false); // Hide loading spinner
        }
    };

    // Database deletion function
    const deleteDatabase = async (deleteClass, jwtToken) => {
        try {
            const response = await axios.delete(`${process.env.REACT_APP_API_URL}/api/students/delete/studentDatabase`, {
                data: {
                    class: deleteClass,
                },
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                }
            }).then(navigate("/admin/dashboard"));
            notification.success({
                message: 'Deleted',
                description: response.data.message || 'Database successfully deleted.',
                duration: 2,
            });
        } catch (error) {
            const errorMessage = error.response?.data?.message || "An unexpected error occurred.";
            Swal.fire("Error", errorMessage, "error");
        }
    };

    const handleOtpVerification = async (e) => {
        e.preventDefault(); // Prevent form submission
        setLoading(true); // Show loading spinner

        try {
            await verifyOtp(otp); // Verify OTP
            message.success("OTP Verified Successfully");
            setOtp("");
            await deleteDatabase(deleteClass, jwtToken); // Perform database deletion
        } catch (error) {
            if (error.message === 'Invalid OTP.') {
                Swal.fire("Error", "Invalid OTP. Please try again.", "error");
            } else {
                Swal.fire("Error", error.message, "error");
            }
            setOtp("");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h3 className="text-center text-danger mb-3">
                DELETE ALL RECORDS
            </h3>

            {/* Delete Database Card */}
            <div className="card">
                {step === 1 && (
                    <form onSubmit={handlePasswordVerification}>
                        <h5 className="card-header bg-danger text-white">
                            <i className="fa fa-exclamation-triangle me-2" aria-hidden="true"></i>
                            <strong>Select Class to Delete</strong>
                        </h5>
                        <div className="card-body">
                            <div className="form-group mb-2">
                                <select
                                    name="selectClass"
                                    className="form-control"
                                    value={deleteClass}
                                    onChange={(e) => setDeleteClass(e.target.value)}
                                >
                                    <option value="" disabled>
                                        Select Class
                                    </option>
                                    <option value="9">Class 9</option>
                                    <option value="10">Class 10</option>
                                </select>
                            </div>
                            <h5 className="text-danger mb-3">
                                <strong>NOTE: </strong>This will delete all data of the selected class, including all student entries and their attendances.
                            </h5>
                            <div className="form-group mb-3">
                                <input
                                    name="password"
                                    type="password"
                                    className="form-control"
                                    placeholder="Enter admin verification password"
                                    maxLength="20"
                                    value={verificationPassword}
                                    onChange={(e) => setVerificationPassword(e.target.value)}
                                    disabled={!isConfirmed || !deleteClass || loading} // Disable if checkbox, class is not selected or loading
                                    required
                                />
                            </div>
                            <div className="form-check mb-3">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="confirmCheckbox"
                                    checked={isConfirmed}
                                    onChange={(e) => setIsConfirmed(e.target.checked)} // Toggle checkbox state
                                    disabled={loading} // Disable if loading
                                />
                                <label className="form-check-label" htmlFor="confirmCheckbox">
                                    I agree and understand that this action is irreversible.
                                </label>
                            </div>
                            <div className="d-flex justify-content-center">
                                <button
                                    type="submit"
                                    className="btn btn-danger w-25"
                                    disabled={!isConfirmed || !deleteClass || loading}
                                >
                                    {loading ? <i className="fa fa-spinner fa-spin"></i> : <i className="fa fa-paper-plane me-2"></i>} Send OTP {/* FA icon before button */}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary w-25 ms-2"
                                    onClick={handleCancel}
                                    disabled={loading} // Disable if loading
                                >
                                    {loading ? <i className="fa fa-spinner fa-spin"></i> : <i className="fa fa-times me-2"></i>} Cancel {/* FA icon before button */}
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleOtpVerification} className="p-3">
                        <h5>
                            <strong>A one-time password (OTP) has been sent to registered contact number.</strong>
                        </h5>
                        <div className="form-group mt-3">
                            <input
                                name="otp"
                                type="text"
                                className="form-control mb-3"
                                placeholder="Enter OTP"
                                maxLength="6"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                disabled={loading} // Disable if loading
                            />
                            <div className="d-flex justify-content-center">
                                <button
                                    type="submit"
                                    className="btn btn-danger w-50"
                                    disabled={loading}
                                >
                                    {loading ? <i className="fa fa-spinner fa-spin"></i> : <i className="fa fa-check me-2"></i>} Verify OTP & Delete Database of Class: {deleteClass} {/* FA icon before button */}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary w-25 ms-2"
                                    onClick={handleCancel}
                                    disabled={loading} // Disable if loading
                                >
                                    {loading ? <i className="fa fa-spinner fa-spin"></i> : <i className="fa fa-times me-2"></i>} Cancel {/* FA icon before button */}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default DeleteDatabase;
