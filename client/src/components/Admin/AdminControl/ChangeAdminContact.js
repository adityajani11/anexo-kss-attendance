import React, { useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { message } from "antd";
import { getAdminContact, generateOtp, sendOtp, verifyOtp } from "../../Utils/utils";
import { useNavigate } from "react-router-dom";

const ChangeAdminContact = () => {
  const [username, setUsername] = useState(""); // Admin username for validation
  const [contact, setContact] = useState(""); // Admin's current contact number
  const [newContact, setNewContact] = useState(""); // Admin's new contact number
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleSendOTP = async () => {
    try {
      setLoading(true);

      // Prevent updating if the new contact is the same as the current one
      if (contact === newContact) {
        message.error("New contact number cannot be the same as the current one.");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/validate`,
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
      const errorMessage = error.response?.data?.message || "Validation failed. Please try again.";
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
      allowOutsideClick: false
    }).then(async (result) => {
      if (result.isConfirmed) {
        const otp = result.value;

        try {
          setLoading(true);
          await verifyOtp(otp); // Verify OTP using your utility function
          setLoading(false);
          handleUpdateContact();
        } catch (error) {
          setLoading(false);
          message.error(error.message || "Invalid OTP.");
        }
      }
    });
  };

  const handleUpdateContact = async () => {
    try {
      setLoading(true);
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/changeAdminContact`,
        {
          username,
          currentContact: contact,
          newContact
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setLoading(false);
      message.success("Contact number updated successfully.");
      navigate("/admin/dashboard");
    } catch (error) {
      setLoading(false);
      const errorMessage =
        error.response?.data?.message || "Failed to update contact number.";
      message.error(errorMessage);
    }
  };

  return (
    <div className="container">
      <h3 className="text-danger text-center mb-3">CHANGE CONTACT NUMBER</h3>
      <div className="card">
        <h5 className="card-header bg-danger text-white">
          <strong>Change Admin Contact</strong>
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
              <strong>Current Contact Number</strong>
            </label>
            <input
              type="tel"
              id="contact"
              className="form-control"
              placeholder="Enter current contact number"
              maxLength="10"
              autoComplete="off"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>
          <div className="form-group mb-3">
            <label htmlFor="newContact" className="mb-1">
              <strong>New Contact Number</strong>
            </label>
            <input
              type="tel"
              id="newContact"
              className="form-control"
              placeholder="Enter new contact number"
              maxLength="10"
              autoComplete="off"
              value={newContact}
              onChange={(e) => setNewContact(e.target.value)}
            />
          </div>
          <button
            className="btn btn-danger"
            onClick={handleSendOTP}
            disabled={!username || !contact || !newContact || loading}
          >
            {loading ? (
              <i className="fa fa-spinner fa-spin me-2"></i>
            ) : (
              <i className="fa fa-paper-plane me-2"></i>
            )}
            Send OTP
          </button>
          <div className="m-2">
            <strong>OTP will be sent to current registered phone number.</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeAdminContact;
