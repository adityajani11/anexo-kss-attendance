const Student = require("../models/Student");
const Attendance = require("../models/Attendance");

exports.addStudent = async (req, res) => {
  try {
    // Extract the barcode from the request body
    const { barcode } = req.body;

    // Check if the barcode already exists in the database
    const existingStudent = await Student.findOne({ barcode });
    if (existingStudent) {
      return res.status(400).json({ message: "Student with this barcode already exists" });
    }

    // If barcode doesn't exist, proceed to add the student
    const student = new Student(req.body);
    await student.save();

    res.status(201).json({ message: "Student added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to add student", error: error.message });
  }
};

// Edit student
exports.editStudent = async (req, res) => {
  try {
    const {
      name,
      contactNumber,
      alternateContactNumber,
      city,
      barcode,
      class: studentClass,
      dateOfBirth,
      gender,
      grNumber,
      note
    } = req.body;

    // Validate gender field
    if (gender !== "all" && !["Male", "Female", "Other"].includes(gender)) {
      return res.status(400).json({ message: "Invalid gender specified" });
    }

    // Ensure studentClass is an integer
    const classInt = parseInt(studentClass, 10);
    if (isNaN(classInt)) {
      return res.status(400).json({ message: "Invalid class value. Must be a number." });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      {
        name,
        contactNumber,
        alternateContactNumber,
        city,
        barcode,
        class: classInt,  // Save as an integer
        dateOfBirth,
        gender,
        grNumber,
        note
      },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ message: "Student updated successfully", student });

  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ message: "Failed to update student" });
  }
};

// Delete a student [CORRECT SECURE]
exports.deleteStudent = async (req, res) => {
  try {
    // Find the student by ID to retrieve the barcode
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const barcodeToDelete = student.barcode;

    // Delete the student from the Student table
    const deletedStudent = await Student.findByIdAndDelete(req.params.id);
    if (!deletedStudent) {
      return res.status(500).json({ message: "Failed to delete the student from the database" });
    }

    // Remove the student's barcode from all attendance records
    await Attendance.updateMany(
      {},
      {
        $pull: {
          presentList: { barcode: barcodeToDelete },
          absentList: { barcode: barcodeToDelete },
        },
      }
    );

    res.status(200).json({ message: "Student and related attendance entries deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred during the deletion process" });
  }
};

//Get Student By ID
exports.getStudentById = async (req, res) => {
  try {
    // Find the student by ID
    const student = await Student.findById(req.params.id);

    // If the student is not found
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Return the student data
    res.status(200).json(student);
  } catch (error) {
    // Handle unexpected errors
    console.error(error);
    res.status(500).json({ message: "An error occurred while retrieving the student" });
  }
};

// Get student list by class, gender, city
exports.getStudentsByClassAndGender = async (req, res) => {
  try {
    const className = parseInt(req.params.class, 10); // Parse class parameter as integer
    const searchQuery = req.query.search || ""; // Get search query if provided, default to empty string
    let gender = req.query.gender ? req.query.gender.charAt(0).toUpperCase() + req.query.gender.slice(1).toLowerCase() : "All"; // Ensure gender is properly formatted (e.g., "Male", "Female", "Other")

    // Validate class parameter
    if (isNaN(className) || className < 1) {
      return res.status(400).json({ message: "Invalid or missing class specified" });
    }

    // Base filter object
    const filter = {
      class: className,
      $or: [
        { name: { $regex: searchQuery, $options: "i" } }, // Case-insensitive search by name
        { city: { $regex: searchQuery, $options: "i" } }, // Case-insensitive search by city
      ],
    };

    // Add gender filter if specified and valid
    if (gender !== "All" && ["Male", "Female", "Other"].includes(gender)) {
      filter.gender = gender; // Ensure "Male", "Female", or "Other"
    } else if (gender !== "All") {
      return res.status(400).json({ message: "Invalid gender specified" });
    }

    // Fetch students based on filters
    const students = await Student.find(filter);

    res.status(200).json({ class: className, gender, students });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch students", error: error.message });
  }
};

// API for getting student count
exports.getStudentCounts = async (req, res) => {
  try {
    const getAttendanceCountsByClass = async () => {
      const students = await Student.find().select("barcode class");
      const barcodesByClass = students.reduce((acc, student) => {
        acc[student.class] = acc[student.class] || [];
        acc[student.class].push(student.barcode);
        return acc;
      }, {});

      const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
      const attendance = await Attendance.find({ date: today });

      const classCounts = {};
      for (const classNum in barcodesByClass) {
        const barcodes = barcodesByClass[classNum];

        const presentSet = new Set(
          attendance.flatMap((record) =>
            record.presentList.filter((entry) => barcodes.includes(entry.barcode)).map((entry) => entry.barcode)
          )
        );
        const absentSet = new Set(
          attendance.flatMap((record) =>
            record.absentList.filter((entry) => barcodes.includes(entry.barcode)).map((entry) => entry.barcode)
          )
        );

        classCounts[classNum] = {
          studentCount: barcodes.length,
          presentCount: presentSet.size,
          absentCount: absentSet.size,
        };
      }

      return classCounts;
    };

    const totalStudents = await Student.countDocuments();
    const allClasses = await Student.distinct("class");
    const classDetails = await getAttendanceCountsByClass();

    const totalPresentStudents = Object.values(classDetails).reduce((sum, c) => sum + c.presentCount, 0);
    const totalAbsentStudents = Object.values(classDetails).reduce((sum, c) => sum + c.absentCount, 0);

    return res.status(200).json({
      totalStudents,
      totalPresentStudents,
      totalAbsentStudents,
      classDetails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching student counts" });
  }
};

// API for delete student database by class
exports.deleteStudentsDatabaseByClass = async (req, res) => {
  try {
    const { class: className } = req.body; // Get class from request body
    const classNum = Number(className);

    // Validate class
    const validClasses = [9, 10];
    if (!classNum || !validClasses.includes(classNum)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class.",
      });
    }

    // Fetch all students in the specified class
    const students = await Student.find({ class: classNum });
    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No students found in class ${classNum}`,
      });
    }

    // Collect all student IDs and barcodes
    const studentIds = students.map((student) => student._id);
    const studentBarcodes = students.map((student) => student.barcode);

    // Delete attendance entries where the barcode matches students in the specified class
    const deleteAttendanceResult = await Attendance.updateMany(
      {},
      {
        $pull: {
          presentList: { barcode: { $in: studentBarcodes } },
          absentList: { barcode: { $in: studentBarcodes } },
        },
      }
    );

    // Delete students from the Student collection
    const deleteStudentResult = await Student.deleteMany({ _id: { $in: studentIds } });

    return res.status(200).json({
      success: true,
      message: `Deleted ${deleteStudentResult.deletedCount} students from class ${classNum}.`,
      attendanceModified: deleteAttendanceResult.nModified,
    });
  } catch (error) {
    console.error("Error deleting students database:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
