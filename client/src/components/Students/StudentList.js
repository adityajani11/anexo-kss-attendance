import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx'; // Import xlsx for Excel export
import "../loader.css";
import "../style/StudentList.css";
import { jsPDF } from "jspdf"; // For generating PDF
import "jspdf-autotable"; // For PDF table export
import { useNavigate } from 'react-router-dom';

function StudentList() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('9');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedGender, setSelectedGender] = useState("all");

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/students/${selectedClass}?search=${searchQuery}&gender=${selectedGender}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }
        });
        setStudents(response.data.students);
      } catch (error) {
        console.error('Error fetching students:');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [selectedClass, searchQuery, selectedGender]);

  const handleEdit = (id) => {
    navigate(`/students/edit-student/${id}`);
  };


  const handleDelete = async (id) => {
    const adminId = localStorage.getItem('adminId');

    if (!adminId) {
      Swal.fire("Error!", "You are not logged in. Please log in again.", "error");
      return;
    }

    Swal.fire({
      title: "Enter Verification Password to Confirm Deletion",
      input: "password",
      inputLabel: "Enter Verification Password",
      inputPlaceholder: "Enter verification password",
      inputAttributes: {
        autocapitalize: "off",
      },
      showCancelButton: true,
      confirmButtonText: "Verify and Delete",
      allowOutsideClick: false,
      confirmButtonColor: "#d44950",
      preConfirm: async (password) => {
        if (!password) {
          Swal.showValidationMessage("Password cannot be blank!");
          return false; // Return false to prevent form submission
        }
        try {
          // Verify password
          const verifyResponse = await axios.post(
            `${process.env.REACT_APP_API_URL}/api/admin/verifyVerificationPassword`,
            { adminId, verificationPassword: password },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          if (verifyResponse.data.success) {
            // If verification is successful, delete the student
            await axios.delete(`${process.env.REACT_APP_API_URL}/api/students/${id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            });

            // Remove the student from the list
            setStudents((prevStudents) => prevStudents.filter((student) => student._id !== id));

            Swal.fire("Deleted!", "The student has been deleted.", "success");
          } else {
            Swal.fire("Error!", "Incorrect password!", "error");
          }
        } catch (error) {
          Swal.fire("Error!", "Error verifying password or deleting student!", "error");
          // Handle specific error scenarios
          if (error.response) {
            if (error.response.status === 401) {
              Swal.fire("Unauthorized!", error.response.data.message, "error");
            } else if (error.response.status === 500) {
              Swal.fire("Error!", error.response.data.message, "error");
            } else {
              Swal.fire("Error!", error.response.data.message || "An unknown error occurred.", "error");
            }
          } else {
            Swal.fire("Network Error!", "Unable to connect to the server. Check your network connection.", "error");
          }
        }
      },
    });
  };

  const handleViewDetails = (student) => {
    // Helper function to format date as DD-MM-YYYY
    const formatDate = (date) => {
      if (!date) return 'NOT AVAILABLE';

      const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
      const formattedDate = new Date(date).toLocaleDateString(undefined, options);

      const [month, day, year] = formattedDate.split('/');
      return `${day}-${month}-${year}`;
    };

    Swal.fire({
      title: `${student.name}`,
      html: `
        <div style="line-height: 1; text-align: left;">
          <p><strong>Roll Number:</strong> ${student.barcode}</p>
          <p><strong>Contact:</strong> ${student.contactNumber}</p>
          <p><strong>Alternate Contact:</strong> ${student.alternateContactNumber}</p>
          <p><strong>GR-Number:</strong> ${student.grNumber}</p>
          <p><strong>City:</strong> ${student.city}</p>
          <p><strong>Class:</strong> ${student.class}</p>
          <p><strong>Date of Birth:</strong> ${formatDate(student.dateOfBirth)}</p>
          <p><strong>Gender:</strong> ${student.gender}</p>
          <p><strong>Note:</strong> ${student.note || "NA"}</p>
        </div>
      `,
      icon: "success",
    });
  };

  const generateExcelData = () => {
    return students.map(student => ({
      Name: student.name,
      "Roll Number": student.barcode,
      Contact: student.contactNumber,
      City: student.city,
      Class: student.class,
      Gender: student.gender,
      Note: student.note || "NA",
    }));
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    const tableColumn = ["Sr. No.", "Name", "Roll Number", "Contact", "City", "Class", "Gender", "Note"];
    const tableRows = [];

    students.forEach((student, index) => {
      const studentData = [
        index + 1,
        student.name,
        student.barcode,
        student.contactNumber,
        student.city,
        student.class,
        student.gender,
        student.note || "NA"
      ];
      tableRows.push(studentData);
    });

    // Generate the table with the provided data
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      startY: 20,
      margin: { top: 15 },
      styles: { cellPadding: 2 },
    });
    doc.save("Students.pdf");
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(generateExcelData());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'Students.xlsx');
  };

  return (
    <div className="container">
      {/* Class and Gender Select Dropdown */}
      <div className="row">
        {/* Class Select Dropdown */}
        <div className="col mb-3">
          <div>
            <label htmlFor="class"><strong>Class:</strong></label>
            <select
              id="class"
              className="form-control"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="9">Class 9</option>
              <option value="10">Class 10</option>
            </select>
          </div>
        </div>

        {/* Gender Select Dropdown */}
        <div className="col mb-3">
          <div>
            <label htmlFor="gender"><strong>Category:</strong></label>
            <select
              id="gender"
              className="form-control"
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
            >
              <option value="all">All Students</option>
              <option value="Male">Boys</option>
              <option value="Female">Girls</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="col-6 mb-3">
          <label htmlFor="search"><strong>Search:</strong></label>
          <input
            id="search"
            type="text"
            className="form-control"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students by name or city"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Loader */}
      {loading && (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      )}

      {/* No students found message */}
      {!loading && students.length === 0 && (
        <div className="alert alert-warning fw-bold text-center" role="alert">
          No students found matching the search criteria.
        </div>
      )}

      {/* Export to Excel and PDF with confirmation dialog */}
      {!loading && students.length > 0 && (
        <div className="mb-3">
          <button
            className="btn btn-success me-2"
            onClick={() => {
              Swal.fire({
                title: 'Are you sure?',
                text: 'You are about to download the Excel file.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes, download it!',
                cancelButtonText: 'No, cancel!',
              }).then((result) => {
                if (result.isConfirmed) {
                  exportToExcel();
                }
              });
            }}
          >
            <i className="fas fa-file-excel me-2"></i>
            Export Excel
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              Swal.fire({
                title: 'Are you sure?',
                text: 'You are about to download the PDF file.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes, download it!',
                cancelButtonText: 'No, cancel!',
              }).then((result) => {
                if (result.isConfirmed) {
                  exportToPDF();
                }
              });
            }}
          >
            <i className="fas fa-file-pdf me-2"></i>
            Export PDF
          </button>
        </div>
      )}

      {/* Students List */}
      <div className="students-list-container">
        {!loading && students.length > 0 && (
          <div className="table-responsive" style={{ overflowX: "auto" }}>
            <table className="table table-bordered table-hover table-striped">
              <thead>
                <tr>
                  <th>Sr. No.</th>
                  <th>Name</th>
                  <th>Roll Number</th>
                  <th>City</th>
                  <th>Class</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={student._id}>
                    <td>{index + 1}</td>
                    <td>{student.name}</td>
                    <td>{student.barcode}</td>
                    <td>{student.city}</td>
                    <td>{student.class}</td>
                    <td>
                      <div className="d-flex justify-content-center">
                        <button
                          className="btn btn-outline-primary me-2"
                          onClick={() => handleViewDetails(student)}
                        >
                          <i className="bi bi-eye"></i> View
                        </button>
                        <button
                          className="btn btn-outline-success me-2"
                          onClick={() => handleEdit(student._id)}
                        >
                          <i className="bi bi-pencil"></i> Edit
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDelete(student._id)}
                        >
                          <i className="bi bi-trash"></i> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default StudentList;
