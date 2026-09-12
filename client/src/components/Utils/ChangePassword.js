import React, { useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { message } from "antd";
import { getAdminContact, generateOtp, sendOtp, verifyOtp } from "./utils";
import { useNavigate } from "react-router-dom";

const ChangePassword = ({ title, apiValidateEndpoint, apiChangePasswordEndpoint, passwordLabel }) => {
  const [username, setUsername] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const handleSendOTP = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}${apiValidateEndpoint}`,
        { username, contact },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const otp = generateOtp();
        const receiver = await getAdminContact();
        await sendOtp(receiver, otp)
          .then(response => {
            message.success("An OTP has been sent to your registered contact via WhatsApp. Please check to proceed.");
          })
          .catch(error => {
            Swal.fire("Error", error.message || "Failed to send OTP. Please try again.", "error");
          }).then(handleVerifyOTP());
      } else {
        message.error("Invalid username or contact details.");
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
      confirmButtonText: "Verify",
      allowOutsideClick: false, // Prevent closing by clicking outside
    }).then(async (result) => {
      if (result.isConfirmed) {
        const otp = result.value;

        try {
          setLoading(true);
          await verifyOtp(otp);
          setLoading(false);
          handleUpdatePassword();
        } catch (error) {
          setLoading(false);
          message.error(error.message || "Invalid OTP.");
        }
      }
    });
  };

  const handleUpdatePassword = () => {
    Swal.fire({
      title: `Enter New ${passwordLabel}`,
      input: "password",
      inputLabel: `New ${passwordLabel} - Do not enter blank password`,
      showCancelButton: true,
      confirmButtonText: "Next",
      allowOutsideClick: false, // Prevent closing by clicking outside
    }).then(async (result) => {
      if (result.isConfirmed) {
        const newPassword = result.value;

        // Check if the password is not blank
        if (!newPassword.trim()) {
          // Show warning using Ant Design message instead of SweetAlert2
          message.warning("Password cannot be blank. Please enter a valid password.");
          return; // Stop the process if password is blank
        }

        Swal.fire({
          title: `Confirm New ${passwordLabel}`,
          input: "password",
          inputLabel: `Confirm New ${passwordLabel}`,
          showCancelButton: true,
          confirmButtonText: "Update",
          allowOutsideClick: false, // Prevent closing by clicking outside
  
        }).then(async (confirmResult) => {
          if (confirmResult.isConfirmed) {
            const confirmPassword = confirmResult.value;

            if (newPassword !== confirmPassword) {
              Swal.fire({
                icon: "error",
                title: "Oops...",
                text: `${passwordLabel}s do not match!`,
              });
              return;
            }

            try {
              setLoading(true);
              await axios.post(
                `${process.env.REACT_APP_API_URL}${apiChangePasswordEndpoint}`,
                { username, contact, newPassword },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              setLoading(false);
              message.success(`${passwordLabel} updated successfully.`);
              navigate("/admin/dashboard");
            } catch (error) {
              setLoading(false);
              const errorMessage =
                error.response?.data?.message || `Failed to update ${passwordLabel}.`;
              message.error(errorMessage);
            }
          }
        });
      }
    });
  };

  return (
    <div className="container">
      <h3 className="text-danger text-center mb-3">{title}</h3>
      <div className="card">
        <h5 className="card-header bg-danger text-white">
          <strong>{title}</strong>
        </h5>
        <div className="card-body">
          <div className="form-group mb-3">
            <label htmlFor="username" className="mb-1">
              <strong>Username</strong>
            </label>
            <input
              type="text"
              id="username"
              className="form-control"
              placeholder="Enter username"
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
          <button
            className="btn btn-danger"
            onClick={handleSendOTP}
            disabled={!username || !contact || loading}
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

export default ChangePassword;
