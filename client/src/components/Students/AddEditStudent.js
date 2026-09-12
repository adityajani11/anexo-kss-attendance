import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { message } from "antd";
import { useNavigate, useParams } from "react-router-dom";

function AddEditStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState({ submit: false, reset: false });
  const [student, setStudent] = useState({
    name: "",
    contactNumber: "",
    alternateContactNumber: "",
    city: "",
    grNumber: "",
    barcode: "",
    class: "",
    dateOfBirth: "", // Full date of birth string
    gender: "",
    note: "",
    day: "",   // Day part of DOB
    month: "", // Month part of DOB
    year: "",  // Year part of DOB
  });

  useEffect(() => {
    if (id) {
      setLoading({ submit: false, reset: true });
      axios
        .get(`${process.env.REACT_APP_API_URL}/api/students/get-student/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        )
        .then((response) => {
          const stu = response.data;

          // Extract year, month, and day from dateOfBirth
          let year = "";
          let month = "";
          let day = "";

          if (stu.dateOfBirth) {
            const datePart = stu.dateOfBirth.split("T")[0];
            [year, month, day] = datePart.split("-");
          }

          setStudent({
            name: stu.name,
            contactNumber: stu.contactNumber,
            alternateContactNumber: stu.alternateContactNumber,
            city: stu.city,
            grNumber: stu.grNumber,
            barcode: stu.barcode,
            class: stu.class,
            dateOfBirth: stu.dateOfBirth,
            gender: stu.gender,
            note: stu.note,
            day,
            month,
            year,
          });
        })
        .catch((err) => {
          Swal.fire("Error", "Something went wrong!", "error");
        })
        .finally(() => setLoading({ submit: false, reset: false }));
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStudent({ ...student, [name]: value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading({ submit: true, reset: false });

    const { day, month, year, class: classValue } = student;
    const dateOfBirth = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

    // Ensure class is converted to integer
    const requestData = {
      ...student,
      class: parseInt(classValue, 10),
      dateOfBirth,
    };

    try {
      if (id) {
        // Update student
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/students/${id}`,
          requestData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        message.success("Student updated successfully.", 2);
      } else {
        // Add new student
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/students/addStudent`,
          requestData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        handleReset();
        message.success("Student added successfully.", 2);
      }
    } catch (error) {
      let errorMessage = "An error occurred while adding or updating the student.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      Swal.fire("Error", errorMessage, "error");
    } finally {
      setLoading({ submit: false, reset: false });
    }
  };


  const handleReset = () => {
    setStudent({
      name: "",
      contactNumber: "",
      alternateContactNumber: "",
      city: "",
      grNumber: "",
      barcode: "",
      class: "",
      dateOfBirth: "",
      gender: "",
      note: "",
      day: "",
      month: "",
      year: "",
    });
  };

  return (
    <div className="container">
      <h5 className="alert alert-primary text-center">
        <strong>{id ? `UPDATE STUDENT - ${student.barcode} - ${student.name}` : "ADD STUDENT"}</strong>
      </h5>
      <form
        onSubmit={handleFormSubmit}
        onReset={handleReset}
        className="shadow p-4 rounded bg-light"
      >
        <div className="row">
          {/* Full Name and Date of Birth */}
          <div className="col-md-12 mb-3">
            <div className="row">
              <div className="col-md-6">
                <label htmlFor="name" className="form-label fw-bold">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  maxLength="50"
                  className="form-control"
                  placeholder="Surname Name Parent-Name"
                  value={student.name}
                  onInput={(e) => (e.target.value = e.target.value.toUpperCase())}
                  onChange={handleChange}
                  autoComplete="on"
                  required
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="day" className="form-label fw-bold">
                  Date of Birth
                </label>
                <div className="d-flex gap-2">
                  <input
                    type="tel"
                    name="day"
                    id="day"
                    maxLength="2"
                    pattern="^(0[1-9]|[12][0-9]|3[01])$"
                    title="Enter a valid day (01-31)."
                    className="form-control"
                    placeholder="DD"
                    value={student.day}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="tel"
                    name="month"
                    id="month"
                    maxLength="2"
                    pattern="^(0[1-9]|1[0-2])$"
                    title="Enter a valid month (01-12)."
                    className="form-control"
                    placeholder="MM"
                    value={student.month}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="tel"
                    name="year"
                    id="year"
                    maxLength="4"
                    pattern="^\d{4}$"
                    title="Enter a valid 4-digit year."
                    className="form-control"
                    placeholder="YYYY"
                    value={student.year}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Number */}
          <div className="col-md-6 mb-3">
            <label htmlFor="contactNumber" className="form-label fw-bold">
              Contact Number
            </label>
            <input
              type="tel"
              name="contactNumber"
              id="contactNumber"
              maxLength="10"
              className="form-control"
              placeholder="Enter contact number (Without +91)"
              pattern="\d{10}"
              title="Contact number must be exactly 10 digits and numeric."
              value={student.contactNumber}
              onChange={handleChange}
              required
            />
          </div>

          {/* Alternate Contact Number */}
          <div className="col-md-6 mb-3">
            <label htmlFor="alternateContactNumber" className="form-label fw-bold">
              Alternate Contact Number
            </label>
            <input
              type="tel"
              name="alternateContactNumber"
              id="alternateContactNumber"
              maxLength="10"
              className="form-control"
              placeholder="Enter alternate contact number (10 digits) or leave it as NA"
              pattern="(\d{10})|(NA|na)"
              title="Enter a valid 10-digit contact number or NA."
              value={student.alternateContactNumber}
              onInput={(e) => (e.target.value = e.target.value.toUpperCase())}
              onChange={handleChange}
              required
            />
          </div>

          {/* City */}
          <div className="col-md-6 mb-3">
            <label htmlFor="city" className="form-label fw-bold">
              City
            </label>
            <input
              type="text"
              name="city"
              id="city"
              maxLength="20"
              className="form-control"
              placeholder="Enter city"
              value={student.city}
              onInput={(e) => (e.target.value = e.target.value.toUpperCase())}
              onChange={handleChange}
              required
            />
          </div>

          {/* GR Number */}
          <div className="col-md-6 mb-3">
            <label htmlFor="grNumber" className="form-label fw-bold">
              GR Number
            </label>
            <input
              type="text"
              name="grNumber"
              id="grNumber"
              maxLength="4"
              className="form-control"
              placeholder="Enter GR Number"
              pattern="^(\d{4})|(NA|na)$"
              title="GR Number must be 'exactly 4 digits and numeric' or 'NA'."
              value={student.grNumber}
              onInput={(e) => (e.target.value = e.target.value.toUpperCase())}
              onChange={handleChange}
              required
            />
          </div>

          {/* Barcode */}
          <div className="col-md-6 mb-3">
            <label htmlFor="barcode" className="form-label fw-bold">
              Barcode
            </label>
            <input
              type="text"
              name="barcode"
              id="barcode"
              maxLength="10"
              className="form-control"
              placeholder="Barcode starts with KSS"
              pattern="KSS\d{7}"
              title="Correct format is KSS followed by 7 digits."
              value={student.barcode}
              onInput={(e) => (e.target.value = e.target.value.toUpperCase())}
              onChange={handleChange}
              required
              disabled={!!id}
            />
          </div>

          {/* Class */}
          <div className="col-md-6 mb-3">
            <label className="form-label fw-bold">Class</label>
            <select
              name="class"
              id="class"
              className="form-select"
              value={student.class}
              onChange={handleChange}
            >
              <option>Select Class</option>
              <option value="9">9</option>
              <option value="10">10</option>
            </select>
          </div>

          {/* Gender */}
          <div className="col-md-6 mb-3">
            <label className="form-label fw-bold">Gender</label>
            <select
              name="gender"
              id="gender"
              className="form-select"
              value={student.gender}
              onChange={handleChange}
            >
              <option>Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Note */}
          <div className="col-md-6 mb-3">
            <label htmlFor="note" className="form-label fw-bold">
              Note (Optional)
            </label>
            <input
              type="text"
              name="note"
              id="note"
              maxLength="255"
              className="form-control"
              placeholder="Enter additional note"
              title="Please limit notes to 255 characters."
              value={student.note}
              onInput={(e) => (e.target.value = e.target.value.toUpperCase())}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Submit & Reset Buttons */}
        <div className="text-center mt-3">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading.submit || loading.reset}
          >
            {loading.submit ? (
              <div>
                <i className="fa fa-spinner fa-spin me-2" aria-hidden="true"></i>
                Loading...
              </div>
            ) : id ? (
              <div>
                <i className="bi bi-pencil me-2" aria-hidden="true"></i>
                Update Student
              </div>
            ) : (
              <div>
                <i className="fa fa-user-plus me-2" aria-hidden="true"></i>
                Add Student
              </div>
            )}
          </button>
          {id ? (
            <button
              className="btn btn-secondary ms-2"
              onClick={() => navigate("/students")}
              disabled={loading.submit || loading.reset}
            >
              <i className="fa-solid fa-times me-2" aria-hidden="true"></i>
              Cancel
            </button>
          ) : (
            <button
              type="reset"
              className="btn btn-secondary ms-2"
              disabled={loading.submit || loading.reset}
            >
              {loading.reset ? (
                <div>
                  <i className="fa fa-spinner fa-spin me-2" aria-hidden="true"></i>
                  Resetting...
                </div>
              ) : (
                <div>
                  <i className="fa-solid fa-eraser me-2" aria-hidden="true"></i>
                  Clear
                </div>
              )}
            </button>
          )}
        </div>

      </form>
    </div>
  );
}

export default AddEditStudent;
