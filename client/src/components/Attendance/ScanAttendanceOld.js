import React, { useState, useEffect, useRef } from 'react';
import { notification } from 'antd';
import Swal from 'sweetalert2';
import axios from 'axios';

function ScanAttendance() {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false); // State to manage loader visibility
  const [selectedAbsClass, setSelectedAbsClass] = useState(""); // For selection of mark absentees
  const [selectedMsgClass, setSelectedMsgClass] = useState(""); // For selection of send messages
  const inputRef = useRef(null); // Ref for the input field

  const token = localStorage.getItem('token');

  // Function to play a sound
  const playSound = (sound) => {
    const audio = new Audio(sound);
    audio.play();
  };

  const openNotification = (type, title, description) => {
    notification[type]({
      message: title,
      description,
      placement: 'topRight',
      duration: 1.5,
    });
  };

  const handleScan = async () => {
    if (!barcode.trim()) {
      openNotification('error', 'Error', 'Barcode cannot be empty');
      playSound('/sounds/failure.mp3');
      return;
    }

    try {
      const currentTimeUTC = new Date().toISOString(); // Store in UTC format
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/attendance/scan`,
        {
          barcode,
          timestamp: currentTimeUTC, // Store the UTC timestamp
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      if (response.data.message === "Attendance already marked for today") {
        openNotification('warning', 'Warning', response.data.message);
        playSound('/sounds/failure.mp3');
        setBarcode('');
      } else {
        openNotification('success', 'Success', response.data.message || 'Student marked as present');
        playSound('/sounds/success.mp3'); // Play success sound
        setBarcode(''); // Clear barcode input
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error marking student attendance';
      openNotification('error', 'Error', errorMessage);
      playSound('/sounds/failure.mp3'); // Play failure sound
      setBarcode(''); // Clear barcode input on failure
    } finally {
      inputRef.current.focus(); // Refocus input after scan attempt
    }
  };

  const handleMarkAbsentees = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `This will mark all remaining students in class ${selectedAbsClass} as absent for today, and this action cannot be undone.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, mark as absent',
      cancelButtonText: 'Cancel',
    });
    
    if (result.isConfirmed) {
      try {
        setLoading(true); // Show loader
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/attendance/absentees`,
          { absentClass: selectedAbsClass },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        );
        openNotification('success', 'Done', response.data.message || `All students in class ${selectedAbsClass} marked as absent.`);
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Error marking all students as absent';
        openNotification('error', 'Error', errorMessage);
      } finally {
        setLoading(false); // Hide loader once the API call completes
      }
    }
  };

  const handleSendMessages = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `This action will send WhatsApp messages to the parents of absent students in class ${selectedMsgClass}. Do you wish to proceed?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, send messages',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        setLoading(true); // Show loader
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/send-absent-messages`,
          { absentClass: selectedMsgClass },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        );
        // If the response is successful, show a success message
        if (response.status === 200) {
          Swal.fire({
            title: 'Note!',
            text: response.data.message || `Messages sent to parents of absent students in class ${selectedMsgClass}.`,
            icon: 'success',
          });
        }
      } catch (error) {
        // If the API call fails, show an error message
        Swal.fire({
          title: 'Error!',
          text: error.response?.data?.message || 'An error occurred while sending messages.',
          icon: 'error',
        });
      } finally {
        setLoading(false); // Hide loader once the API call completes
      }
    }
  };

  useEffect(() => {
    inputRef.current.focus(); // Focus input on component load
  }, []);

  return (
    <div className="container">
      <div className="row justify-content-center m-2">
        <h5 className="alert alert-primary text-center">
          <strong>SCAN BARCODE</strong>
        </h5>
        <div className="col-md-8 mt-3">
          <h5 className="fw-bold mb-3">Scan Student's barcode [Roll Number].</h5>
          <input
            type="text"
            id="scanBarcode"
            className="form-control"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value.trim().toUpperCase())}
            placeholder="Scan Barcode"
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            onBlur={() => inputRef.current.focus()} // Ensure focus is retained
            autoFocus
            ref={inputRef}
            maxLength="10"
          />
          <p className="text-muted fw-bold mt-2">
            To manually enter a barcode, type it into the "Scan Barcode" field and press <kbd className="bg-secondary">ENTER</kbd>.
          </p>
          <hr />

          <div className="col container rounded bg-white p-3">
            <h5 className="fst-italic text-muted">
              This will mark all remaining students as ABSENT.
            </h5>

            <select
              className="form-select mb-2"
              value={selectedAbsClass}
              onChange={(e) => setSelectedAbsClass(e.target.value)}
            >
              <option value="">Select Class</option>
              <option value="9">Class 9</option>
              <option value="10">Class 10</option>
            </select>

            <button
              className="btn btn-danger mt-2"
              onClick={handleMarkAbsentees}
              disabled={loading || !selectedAbsClass} // Disable if loading or no class selected
            >
              {loading ? (
                <i className="fa fa-spinner fa-spin me-2"></i>
              ) : (
                <i className="fa fa-ban me-2"></i>
              )}
              Mark All Absent
            </button>
          </div>
          <hr />

          <div className="container rounded bg-white p-3">
            <h5 className="fst-italic text-muted">
              Notify parents of absent students via WhatsApp by clicking the button below.
            </h5>

            <select
              className="form-select mb-2"
              value={selectedMsgClass}
              onChange={(e) => setSelectedMsgClass(e.target.value)}
            >
              <option value="">Select Class</option>
              <option value="9">Class 9</option>
              <option value="10">Class 10</option>
            </select>

            <button
              className="btn btn-danger mt-2"
              onClick={handleSendMessages}
              disabled={loading || !selectedMsgClass} // Disable if loading or no class selected
            >
              {loading ? (
                <i className="fa fa-spinner fa-spin me-2"></i>
              ) : (
                <i className="bi bi-whatsapp me-2"></i>
              )}
              Send Absent Messages
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default ScanAttendance;
