const express = require("express");
const router = express.Router();
const attendanceController = require("../controller/attendanceController");
const authenticate = require("../middleware/auth");

router.post("/scan", authenticate, attendanceController.markAttendance);
router.post("/absentees", authenticate, attendanceController.markAbsentees);
router.post("/getAttendanceData", authenticate, attendanceController.getAttendanceData);
router.post('/monthly', authenticate, attendanceController.getMonthlyAttendance);
router.post('/get/today', authenticate, attendanceController.getTodayAttendance);
router.get("/:barcode", authenticate, attendanceController.getAttendanceByBarcode);
router.post("/updateAttendance", authenticate, attendanceController.updateAttendance);
router.post("/get/all-attendance", authenticate, attendanceController.getAllAttendance);

module.exports = router;
