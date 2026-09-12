const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const axios = require("axios");
const https = require("https");

const sendAbsentMessage = async (req, res) => {
  const { absentClass } = req.body;

  if (!absentClass) {
    return res.status(400).json({ message: "Please provide a class." });
  }

  try {
    // Get today's date in IST
    const istDate = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
    const today = new Date(istDate.toISOString().split("T")[0]); // Format YYYY-MM-DD

    // Find today's attendance record
    const attendanceRecord = await Attendance.findOne({ date: today });

    if (!attendanceRecord || attendanceRecord.absentList.length === 0) {
      return res.status(404).json({
        message: `No absentees found for class ${absentClass} today.`,
      });
    }

    // Filter absent students by class
    const absentees = await Student.find({
      barcode: { $in: attendanceRecord.absentList.map(a => a.barcode) },
      class: absentClass, // Filter only selected class
    });

    if (absentees.length === 0) {
      return res.status(200).json({
        message: `No absentees found for class ${absentClass} today.`,
      });
    }

    // Custom HTTPS agent to bypass SSL validation
    const agent = new https.Agent({ rejectUnauthorized: false });

    const failedMessages = [];

    // Get today's date in DD/MM/YYYY format
    const formattedTodayDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    // Iterate through absent students and send messages
    for (const student of absentees) {
      try {
        const phoneNumber = student.contactNumber; // Primary contact number
        if (!phoneNumber) {
          throw new Error(`No contact number found for student: ${student.name}`);
        }

        await axios.post(
          process.env.WHATSAPP_API_URL,
          {
            to: phoneNumber,
            recipient_type: "individual",
            type: "template",
            template: {
              name: "send_absent_message", // Template name
              language: {
                policy: "deterministic",
                code: "en", // Language code
              },
              components: [
                {
                  type: "body",
                  parameters: [
                    { type: "text", text: student.name }, // Student name
                    { type: "text", text: formattedTodayDate }, // Formatted date
                  ],
                },
              ],
            },
          },
          {
            httpsAgent: agent,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.WHATAPI_TOKEN}`,
            },
          }
        );
      } catch (error) {
        failedMessages.push({ student: student.name, error: error.response?.data || error.message });
      }
    }

    if (failedMessages.length > 0) {
      return res.status(500).json({
        message: "Some messages failed to send.",
        failedMessages,
      });
    }

    res.status(200).json({
      message: `WhatsApp messages sent successfully to absent students of class ${absentClass}.`,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to send WhatsApp messages.",
      error: error.message,
    });
  }
};

module.exports = { sendAbsentMessage };