const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Joi = require("joi");
const { validationResult, param } = require('express-validator');
const authenticate = require('../middleware/auth');

// Mark attendance using barcode [NEW APPROACH]
exports.markAttendance = async (req, res) => {
  try {
    // Validate request body
    const schema = Joi.object({
      barcode: Joi.string().required(),
      timestamp: Joi.date().iso().required(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { barcode, timestamp } = value;

    // Convert UTC timestamp to IST
    const istDate = new Date(new Date(timestamp).getTime() + 5.5 * 60 * 60 * 1000);
    const today = new Date(istDate.toISOString().split("T")[0]); // Keep date without time

    // Check if the student exists in the Student table
    const studentExists = await Student.findOne({ barcode }).lean();
    if (!studentExists) {
      return res.status(404).json({ message: "Invalid barcode. Student not found." });
    }

    // Check if an attendance document exists for the current date
    let attendanceDoc = await Attendance.findOne({ date: today });

    if (!attendanceDoc) {
      // Create a new attendance document if it doesn't exist
      attendanceDoc = await Attendance.create({
        date: today,
        presentList: [],
        absentList: [],
      });
    }

    // Check if the student is in the absentList
    const isAbsent = attendanceDoc.absentList.some(
      (record) => record.barcode === barcode
    );

    if (isAbsent) {
      return res.status(409).json({
        message: "Student is marked as absent. Cannot mark as present.",
      });
    }

    // Check if the student is already marked present
    const isPresent = attendanceDoc.presentList.some(
      (record) => record.barcode === barcode
    );

    if (isPresent) {
      return res.status(409).json({
        message: "Attendance already marked for this student today.",
      });
    }

    // Mark the student as present by adding to the presentList
    attendanceDoc.presentList.push({
      barcode,
      timestamp: istDate,
    });

    // Save the updated attendance document
    await attendanceDoc.save();

    res.status(200).json({
      message: "Attendance marked as present.",
      attendance: attendanceDoc,
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    const statusCode = error instanceof mongoose.Error ? 400 : 500;
    res.status(statusCode).json({
      message: "Failed to mark attendance.",
      error: error.message,
    });
  }
};

// Mark absentees [NEW APPROACH]
exports.markAbsentees = async (req, res) => {
  const { absentClass } = req.body;
  if (!absentClass) {
    return res.status(400).json({ message: "Please provide valid class to mark absentees." });
  }
  try {
    // Get today's date in IST without time (start of the day)
    const istDate = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000); // Current IST time
    const today = new Date(istDate.toISOString().split("T")[0]); // Keep date only

    // Check if there are any students in the system
    const studentCount = await Student.countDocuments({ class: { $in: absentClass } });;
    if (studentCount === 0) {
      return res.status(200).json({
        message: "No students found in the selected class.",
      });
    }

    // Find the attendance document for today
    let attendanceDoc = await Attendance.findOne({ date: today });

    if (!attendanceDoc) {
      // Create a new attendance document if it doesn't exist
      attendanceDoc = await Attendance.create({
        date: today,
        presentList: [],
        absentList: [],
      });
    }

    // Check if absentees have already been marked for the selected classes
    const alreadyMarked = attendanceDoc.absentList.some((record) =>
      absentClass.includes(record.class)
    );

    if (alreadyMarked) {
      return res.status(409).json({
        message: "Absentees for the selected class have already been marked today.",
      });
    }

    // Get barcodes of students already marked present
    const markedBarcodes = attendanceDoc.presentList.map((record) => record.barcode);

    // Find students in the given classes who are not marked present
    const absentees = await Student.find({
      class: { $in: absentClass },
      barcode: { $nin: markedBarcodes },
    }).lean();

    if (absentees.length === 0) {
      return res.status(200).json({
        message: `All students in class ${absentClass} are already marked present.`,
      });
    }

    // Prepare absent records
    const absentRecords = absentees.map((student) => ({
      barcode: student.barcode,
      class: student.class,
      timestamp: istDate,
    }));

    // Add absentees to the absentList
    attendanceDoc.absentList.push(...absentRecords);

    // Save the updated attendance document
    await attendanceDoc.save();

    res.status(200).json({
      message: `Absentees for class ${absentClass} marked successfully.`,
      absentCount: absentRecords.length,
      absentees: absentRecords,
    });
  } catch (error) {
    console.error("Error marking absentees:", error);
    res.status(500).json({
      message: "Failed to mark absentees.",
      error: error.message,
    });
  }
};

// API for downloading attendance data for Excel & PDF
exports.getAttendanceData = async (req, res) => {
  try {
    const { std: classNumber, gender, status } = req.body;

    // Get today's date in IST
    const istDate = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
    const today = new Date(istDate.toISOString().split("T")[0]);

    // Fetch attendance records for today
    const attendanceRecords = await Attendance.find({ date: today });

    if (attendanceRecords.length === 0) {
      return res.status(404).json({ message: "No attendance records found for today." });
    }

    // Extract barcodes from presentList and absentList
    const presentBarcodes = attendanceRecords.flatMap(record =>
      record.presentList.map(item => ({
        barcode: item.barcode,
        timestamp: item.timestamp
      }))
    );

    const absentBarcodes = attendanceRecords.flatMap(record =>
      record.absentList.map(item => ({
        barcode: item.barcode,
        timestamp: item.timestamp
      }))
    );

    // Determine target barcodes based on status
    let targetBarcodes;
    if (status === "ALL") {
      targetBarcodes = [...presentBarcodes, ...absentBarcodes];
    } else if (status.toUpperCase() === "PRESENT") {
      targetBarcodes = presentBarcodes;
    } else if (status.toUpperCase() === "ABSENT") {
      targetBarcodes = absentBarcodes;
    } else {
      return res.status(400).json({ error: "Invalid status provided. Use 'PRESENT', 'ABSENT', or 'NO ENTRY'." });
    }

    // Set gender filter
    const genderFilter = gender === "ALL" ? ["Male", "Female", "Other"] : [gender];

    // Set class filter: convert "9" and "10" to numbers, leave "ALL" as string
    const classFilter = classNumber === "ALL" ? [9, 10] : [classNumber];

    // Fetch students matching the class, gender, and barcodes
    const filteredStudents = await Student.find({
      barcode: { $in: targetBarcodes.map(item => item.barcode) },
      gender: { $in: genderFilter },
      class: { $in: classFilter },
    });

    // Handle case where no students match the criteria
    if (filteredStudents.length === 0) {
      return res.status(404).json({ message: "No students found matching the criteria." });
    }

    // Format the response
    const attendanceData = filteredStudents.map(student => {
      const presentEntry = presentBarcodes.find(pb => pb.barcode === student.barcode);
      const absentEntry = absentBarcodes.find(ab => ab.barcode === student.barcode);

      return {
        name: student.name,
        contactNumber: student.contactNumber,
        city: student.city,
        barcode: student.barcode,
        gender: student.gender,
        class: student.class,
        status: presentEntry ? "PRESENT" : "ABSENT",
        timestamp: presentEntry ? presentEntry.timestamp : absentEntry.timestamp,
      };
    });

    // Send the response
    return res.status(200).json({ attendanceData });
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    // Generic error response
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// API for get monthly attendance of particular student
exports.getMonthlyAttendance = async (req, res) => {
  try {
    const { barcode, year, month } = req.body; // Get data from request body

    // Validate barcode, year, and month
    if (!barcode || !year || !month) {
      return res.status(400).json({ error: "Barcode, year, and month are required." });
    }

    // Parse year and month into a date range
    const startDate = new Date(year, month - 1, 1); // Start of the month
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // End of the month

    // Fetch attendance data for the given barcode within the date range
    const attendanceRecords = await Attendance.find({
      date: { $gte: startDate, $lte: endDate },
      $or: [
        { "presentList.barcode": barcode },
        { "absentList.barcode": barcode },
      ],
    });

    // Process attendance data
    const attendance = {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      details: [], // Detailed records for the month
    };

    attendanceRecords.forEach((record) => {
      const presentEntry = record.presentList.find(
        (entry) => entry.barcode === barcode
      );
      const absentEntry = record.absentList.find(
        (entry) => entry.barcode === barcode
      );

      attendance.totalDays++;

      if (presentEntry) {
        attendance.presentDays++;
        attendance.details.push({
          date: record.date,
          status: "PRESENT",
          timestamp: presentEntry.timestamp,
        });
      } else if (absentEntry) {
        attendance.absentDays++;
        attendance.details.push({
          date: record.date,
          status: "ABSENT",
          timestamp: absentEntry.timestamp,
        });
      }
    });

    res.status(200).json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get attendance for a student by barcode
exports.getAttendanceByBarcode = [
  // Input validation middleware
  param('barcode')
    .trim()
    .notEmpty()
    .withMessage('Barcode is required')
    .isAlphanumeric()
    .withMessage('Barcode must be alphanumeric'),

  authenticate, // Ensure user is authenticated before accessing data

  async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { barcode } = req.params;

      // Check if the barcode exists in the Student collection
      const studentExists = await Student.exists({ barcode });
      if (!studentExists) {
        return res.status(404).json({ message: "Student with the given barcode does not exist." });
      }

      // Fetch attendance records for the given barcode
      const attendance = await Attendance.find({
        $or: [
          { 'presentList.barcode': barcode },
          { 'absentList.barcode': barcode },
        ],
      }).select('-_id date presentList absentList'); // Exclude _id, include attendance details

      if (!attendance.length) {
        return res
          .status(404)
          .json({ message: "No attendance records found for the given barcode." });
      }

      // Extract and format attendance for the student
      const formattedAttendance = attendance.map((entry) => ({
        date: entry.date,
        status: entry.presentList.some((record) => record.barcode === barcode)
          ? 'PRESENT'
          : 'ABSENT',
        timestamp:
          entry.presentList.find((record) => record.barcode === barcode)?.timestamp ||
          entry.absentList.find((record) => record.barcode === barcode)?.timestamp,
      }));

      // Respond with formatted attendance data
      res.status(200).json({ attendance: formattedAttendance });
    } catch (error) {
      // Log and return error
      res.status(500).json({ message: "Failed to fetch attendance.", error: error.message });
    }
  },
];

// API to count and categorize today's attendance
exports.getTodayAttendance = async (req, res) => {
  try {
    // Get today's date in 'YYYY-MM-DD' format (IST)
    const istDate = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
    const today = new Date(istDate.toISOString().split("T")[0]);

    // Fetch today's attendance record
    const attendanceRecords = await Attendance.find({ date: today });

    if (attendanceRecords.length === 0) {
      return res.status(404).json({ message: "No attendance records found for today." });
    }

    // Extract barcodes from presentList and absentList
    const presentBarcodes = attendanceRecords.flatMap(record =>
      record.presentList.map(item => item.barcode)
    );
    const absentBarcodes = attendanceRecords.flatMap(record =>
      record.absentList.map(item => item.barcode)
    );

    // Fetch student data for both present and absent barcodes
    const students = await Student.find({
      barcode: { $in: [...presentBarcodes, ...absentBarcodes] },
    });

    // Define possible classes to ensure empty classes are included in response
    const possibleClasses = [9, 10];

    // Categorize students by class and status
    const categorizedData = students.reduce((acc, student) => {
      const classCode = student.class.toString();
      const status = presentBarcodes.includes(student.barcode) ? "PRESENT" : "ABSENT";

      if (!acc[classCode]) {
        acc[classCode] = { PRESENT: [], ABSENT: [] };
      }

      acc[classCode][status].push({ name: student.name, barcode: student.barcode });
      return acc;
    }, {});

    // Ensure all possible classes are represented in the response
    const finalCategorizedData = possibleClasses.reduce((acc, classCode) => {
      if (!categorizedData[classCode]) {
        acc[classCode] = { PRESENT: [], ABSENT: [] };
      } else {
        acc[classCode] = categorizedData[classCode];
      }
      return acc;
    }, {});

    // Calculate counts for each class and status
    const counts = Object.entries(finalCategorizedData).reduce((acc, [classCode, statuses]) => {
      acc[classCode] = {
        PRESENT: statuses.PRESENT.length > 0 ? statuses.PRESENT.length : 0,
        ABSENT: statuses.ABSENT.length > 0 ? statuses.ABSENT.length : 0,
      };
      return acc;
    }, {});

    res.json({
      categorizedData: finalCategorizedData,
      counts,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// Update attendance status
exports.updateAttendance = async (req, res) => {
  try {
    const { barcode, date, status } = req.body;

    // Validate input
    if (!barcode || !date || !status) {
      return res.status(400).json({ error: "Barcode, date, and status are required." });
    }

    // Find the attendance record for the given date
    const attendance = await Attendance.findOne({ date: new Date(date) });
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found for the given date." });
    }

    // Check if the barcode is already in the appropriate list
    if (status === "PRESENT") {
      const isAlreadyPresent = attendance.presentList.some((entry) => entry.barcode === barcode);
      if (isAlreadyPresent) {
        return res.status(422).json({ message: "Attendance already marked as PRESENT." });
      }

      // Move the barcode from absentList to presentList
      const absentIndex = attendance.absentList.findIndex((entry) => entry.barcode === barcode);
      if (absentIndex > -1) {
        const [entry] = attendance.absentList.splice(absentIndex, 1);
        attendance.presentList.push({ barcode: entry.barcode, timestamp: entry.timestamp });
      } else {
        return res.status(404).json({ message: "Barcode not found in absent list." });
      }
    } else if (status === "ABSENT") {
      const isAlreadyAbsent = attendance.absentList.some((entry) => entry.barcode === barcode);
      if (isAlreadyAbsent) {
        return res.status(422).json({ message: "Attendance already marked as ABSENT." });
      }

      // Move the barcode from presentList to absentList
      const presentIndex = attendance.presentList.findIndex((entry) => entry.barcode === barcode);
      if (presentIndex > -1) {
        const [entry] = attendance.presentList.splice(presentIndex, 1);
        attendance.absentList.push({ barcode: entry.barcode, timestamp: entry.timestamp });
      } else {
        return res.status(404).json({ message: "Student not found on given date!" });
      }
    } else {
      return res.status(400).json({ error: "Invalid status. Use 'PRESENT' or 'ABSENT'." });
    }

    // Save the updated attendance record
    await attendance.save();

    res.status(200).json({
      message: `Attendance updated successfully to ${status}.`,
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// API for get all attendance
exports.getAllAttendance = async (req, res) => {
  try {
    const { month, year, standard, gender } = req.body;
    if (!month || !year) {
      return res.status(400).json({ error: "Month and Year are required." });
    }

    // Ensure month is 1-based (1 = Jan, 12 = Dec)
    const monthIndex = month - 1;
    const daysInMonth = new Date(year, month, 0).getDate(); // Get actual days in the month

    // Build the query object for attendance
    let query = {
      date: {
        $gte: new Date(year, monthIndex, 1),
        $lt: new Date(year, monthIndex + 1, 1),
      },
    };

    // Fetch attendance records for the given month and year
    const records = await Attendance.find(query);

    if (!records.length) {
      return res.status(404).json({ error: "No attendance records found for the selected month." });
    }

    // Object to store attendance data
    const musterData = {};

    // Extract all the barcodes from the attendance records
    const barcodes = [...new Set(records.flatMap(record => 
      [...record.presentList, ...record.absentList].map(student => student.barcode)
    ))];

    // Fetch student details based on barcodes (including standard and gender)
    const students = await Student.find({ barcode: { $in: barcodes } });

    // Create a map of barcode to student info (standard, gender)
    const studentMap = students.reduce((map, student) => {
      map[student.barcode] = { standard: student.class, gender: student.gender };
      return map;
    }, {});

    // Filter the records based on standard and gender if provided
    const filteredBarcodes = barcodes.filter(barcode => {
      const studentInfo = studentMap[barcode];
      const isStandardMatch = standard === "ALL" || studentInfo.standard === standard;
      const isGenderMatch = gender === "ALL" || studentInfo.gender === gender;
      return isStandardMatch && isGenderMatch;
    });

    // Object to store attendance data after applying filters
    const filteredMusterData = {};

    // Process attendance records for the filtered barcodes
    records.forEach((record) => {
      const day = new Date(record.date).getDate().toString().padStart(2, "0"); // Get day in "DD" format

      const processStudent = (student, status) => {
        const { barcode } = student;
        // Only process students that match the filter criteria
        if (!filteredBarcodes.includes(barcode)) return;

        if (!filteredMusterData[barcode]) {
          filteredMusterData[barcode] = {};
          for (let i = 1; i <= daysInMonth; i++) {
            filteredMusterData[barcode][i.toString().padStart(2, "0")] = "-"; // Default "-"
          }
        }
        filteredMusterData[barcode][day] = status;
      };

      record.presentList.forEach((student) => processStudent(student, "P"));
      record.absentList.forEach((student) => processStudent(student, "A"));
    });

    res.json({ year, month, muster: filteredMusterData });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
