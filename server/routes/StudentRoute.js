// routes/StudentRoute.js
const express = require('express');
const router = express.Router();
const studentController = require('../controller/studentsController');
const authenticate = require("../middleware/auth");

// Define routes
router.post('/addStudent', authenticate, studentController.addStudent);
router.put('/:id', authenticate, studentController.editStudent);
router.delete('/:id', authenticate, studentController.deleteStudent);
router.get('/get-student/:id', authenticate, studentController.getStudentById);
router.get('/:class', authenticate, studentController.getStudentsByClassAndGender);
router.get('/counts/all', authenticate, studentController.getStudentCounts);
router.delete('/delete/studentDatabase', authenticate, studentController.deleteStudentsDatabaseByClass);

module.exports = router;
