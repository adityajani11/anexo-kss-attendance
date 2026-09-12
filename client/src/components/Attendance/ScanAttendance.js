import React, { useState, useEffect, useRef } from "react";
import { notification } from "antd";
import Swal from "sweetalert2";
import axios from "axios";

function ScanAttendance() {
  const [barcode, setBarcode] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [loading, setLoading] = useState(false); // State to manage loader visibility
  const [selectedAbsClass, setSelectedAbsClass] = useState(""); // For selection of mark absentees
  const [selectedMsgClass, setSelectedMsgClass] = useState(""); // For selection of send messages
  const inputRef = useRef(null); // Ref for the input field
  const scanQueueRef = useRef([]);
  const processingRef = useRef(false);

  const token = localStorage.getItem("token");

  // Function to play a sound
  const playSound = (sound) => {
    const audio = new Audio(sound);
    audio.play();
  };

  const openNotification = (type, title, description) => {
    notification[type]({
      message: title,
      description,
      placement: "topRight",
      duration: 1.5,
    });
  };

  const focusBarcodeInput = () => {
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const handleBarcodeBlur = (event) => {
    if (event.relatedTarget) {
      return;
    }

    window.setTimeout(() => {
      if (
        document.activeElement === document.body ||
        document.activeElement === null
      ) {
        inputRef.current?.focus();
      }
    }, 0);
  };

  const processBarcodeScan = async (normalizedBarcode) => {
    try {
      setScanLoading(true);
      const currentTimeUTC = new Date().toISOString(); // Store in UTC format
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/attendance/scan`,
        {
          barcode: normalizedBarcode,
          timestamp: currentTimeUTC, // Store the UTC timestamp
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.message === "Attendance already marked for today") {
        openNotification("warning", "Warning", response.data.message);
        playSound("/sounds/failure.mp3");
        setBarcode("");
      } else {
        openNotification(
          "success",
          "Success",
          response.data.message || "Student marked as present",
        );
        playSound("/sounds/success.mp3"); // Play success sound
        setBarcode(""); // Clear barcode input
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Error marking student attendance";
      openNotification("error", "Error", errorMessage);
      playSound("/sounds/failure.mp3"); // Play failure sound
    } finally {
      setScanLoading(false);
    }
  };

  const processQueuedScans = async () => {
    if (processingRef.current) {
      return;
    }

    processingRef.current = true;

    while (scanQueueRef.current.length > 0) {
      const nextBarcode = scanQueueRef.current.shift();
      await processBarcodeScan(nextBarcode);
    }

    processingRef.current = false;
    focusBarcodeInput();
  };

  const handleScan = async (event) => {
    event?.preventDefault();

    const normalizedBarcode = barcode.trim().toUpperCase();

    if (!normalizedBarcode) {
      openNotification("error", "Error", "Barcode cannot be empty");
      playSound("/sounds/failure.mp3");
      focusBarcodeInput();
      return;
    }

    scanQueueRef.current.push(normalizedBarcode);
    setBarcode("");
    focusBarcodeInput();
    await processQueuedScans();
  };

  const handleMarkAbsentees = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `This will mark all remaining students in class ${selectedAbsClass} as absent for today, and this action cannot be undone.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, mark as absent",
      cancelButtonText: "Cancel",
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
            },
          },
        );
        openNotification(
          "success",
          "Done",
          response.data.message ||
            `All students in class ${selectedAbsClass} marked as absent.`,
        );
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          "Error marking all students as absent";
        openNotification("error", "Error", errorMessage);
      } finally {
        setLoading(false); // Hide loader once the API call completes
      }
    }
  };

  const handleSendMessages = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `This action will send WhatsApp messages to the parents of absent students in class ${selectedMsgClass}. Do you wish to proceed?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, send messages",
      cancelButtonText: "Cancel",
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
            },
          },
        );
        // If the response is successful, show a success message
        if (response.status === 200) {
          Swal.fire({
            title: "Note!",
            text:
              response.data.message ||
              `Messages sent to parents of absent students in class ${selectedMsgClass}.`,
            icon: "success",
          });
        }
      } catch (error) {
        // If the API call fails, show an error message
        Swal.fire({
          title: "Error!",
          text:
            error.response?.data?.message ||
            "An error occurred while sending messages.",
          icon: "error",
        });
      } finally {
        setLoading(false); // Hide loader once the API call completes
      }
    }
  };

  useEffect(() => {
    focusBarcodeInput();
  }, []);

  useEffect(() => {
    if (!scanLoading) {
      const timer = window.setTimeout(() => {
        focusBarcodeInput();
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [scanLoading]);

  return (
    <div className="container">
      <div className="row justify-content-center m-2">
        <h5 className="alert alert-primary text-center">
          <strong>SCAN BARCODE</strong>
        </h5>
        <div className="col-md-8 mt-3">
          <h5 className="fw-bold mb-3">
            Scan Student's barcode [Roll Number].
          </h5>
          <form onSubmit={handleScan}>
            <div className="row g-2">
              <div className="col-12 col-md">
                <input
                  type="text"
                  id="scanBarcode"
                  className="form-control h-100"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value.toUpperCase())}
                  placeholder="Scan Barcode"
                  onBlur={handleBarcodeBlur}
                  autoFocus
                  ref={inputRef}
                  maxLength="10"
                />
              </div>
              <div className="col-12 col-md-auto">
                <button
                  type="submit"
                  className="btn btn-primary w-100 h-100 px-4"
                  disabled={scanLoading || !barcode.trim()}
                >
                  {scanLoading ? (
                    <>
                      <i className="fa fa-spinner fa-spin me-2"></i>
                      Entering...
                    </>
                  ) : (
                    "Enter"
                  )}
                </button>
              </div>
            </div>
          </form>
          <p className="text-muted fw-bold mt-2">
            Scanner entries will continue to submit automatically. For manual
            entry, type the roll number and press{" "}
            <kbd className="bg-secondary">ENTER</kbd> or click the{" "}
            <strong>Enter</strong> button.
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
              Notify parents of absent students via WhatsApp by clicking the
              button below.
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
