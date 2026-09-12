import React, { useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { message } from "antd";
import { getAdminContact, generateOtp, sendOtp, verifyOtp } from "../../Utils/utils";
import { useNavigate } from "react-router-dom";

const ChangeUsername = () => {
  const [currentUsername, setCurrentUsername] = useState(""); // Admin current username for validation
  const [contact, setContact] = useState(""); // Admin's current contact number
  const [newUsername, setNewUsername] = useState(""); // Admin's new username
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleSendOTP = async () => {
    try {
      setLoading(true);

      // Additional check to ensure new contact is different
      if (currentUsername === newUsername) {
        message.error("New username cannot be the same as the current username.");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/validate`,
        { username: currentUsername, contact, newUsername },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const otp = generateOtp();
        const receiver = await getAdminContact();
        // Call the utility function to send OTP
        await sendOtp(receiver, otp)
          .then(response => {
            // OTP successfully sent
            message.success("An OTP has been sent to your registered contact via WhatsApp. Please check to proceed.");
          })
          .catch(error => {
            // Error occurred while sending OTP
            Swal.fire("Error", error.message || "Failed to send OTP. Please try again.", "error");
          }).then(handleVerifyOTP());

      } else {
        message.error("Admin validation failed. Please check your details.");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Validation failed. Please try again.";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = () => {
    Swal.fire({
      title: "Enter OTP",
      input: "text",
      inputLabel: "OTP",
      showCancelButton: true,
      allowOutsideClick: false,
      confirmButtonText: "Verify & Update",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const otp = result.value;

        try {
          setLoading(true);
          await verifyOtp(otp); // Verify OTP using utility function
          setLoading(false);
          handleUpdateUsername();
        } catch (error) {
          setLoading(false);
          message.error(error.message || "Invalid OTP.");
        }
      }
    });
  };

  const handleUpdateUsername = async () => {
    try {
      setLoading(true);
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/changeAdminUsername`,
        { currentUsername, contact, newUsername },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setLoading(false);
      message.success("Username updated successfully.");
      navigate("/admin/dashboard");
    } catch (error) {
      setLoading(false);
      const errorMessage =
        error.response?.data?.message || "Failed to update username.";
      message.error(errorMessage);
    }
  };

  return (
    <div className="container">
      <h3 className="text-danger text-center mb-3">CHANGE USERNAME</h3>
      <div className="card">
        <h5 className="card-header bg-danger text-white">
          <strong>CHANGE USERNAME</strong>
        </h5>
        <div className="card-body">
          <div className="form-group mb-3">
            <label htmlFor="currentUsername" className="mb-1">
              <strong>Current Username</strong>
            </label>
            <input
              type="text"
              id="currentUsername"
              className="form-control"
              placeholder="Enter current username"
              autoComplete="off"
              value={currentUsername}
              onChange={(e) => setCurrentUsername(e.target.value)}
            />
          </div>
          <div className="form-group mb-3">
            <label htmlFor="contact" className="mb-1">
              <strong>Registered Contact Number</strong>
            </label>
            <input
              type="tel"
              id="contact"
              className="form-control"
              placeholder="Enter registered contact number (without +91)"
              maxLength="10"
              autoComplete="off"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>
          <div className="form-group mb-3">
            <label htmlFor="newUsername" className="mb-1">
              <strong>New Username</strong>
            </label>
            <input
              type="text"
              id="newUsername"
              className="form-control"
              placeholder="Enter new username"
              autoComplete="off"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
          </div>
          <button
            className="btn btn-danger"
            onClick={handleSendOTP}
            disabled={!currentUsername || !contact || !newUsername || loading}
          >
            {loading ? (
              <i className="fa fa-spinner fa-spin me-2"></i>
            ) : (
              <i className="fa fa-paper-plane me-2"></i>
            )}
            Send OTP
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeUsername;
