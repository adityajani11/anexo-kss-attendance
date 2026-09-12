import React, { useState, useEffect } from 'react';
import './App.css';
import ProtectedRoute from './ProtectedRoute';
import Navbar from "./components/Navbar";
import LoadingBar from 'react-top-loading-bar';
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import AdminRegister from './components/Admin/AdminRegister';
import AdminLogin from './components/Admin/AdminLogin';
import AdminDashboard from './components/Admin/AdminDashboard';
import ScanAttendance from './components/Attendance/ScanAttendance';
import ViewAttendance from './components/Attendance/ViewAttendance';
import StudentList from './components/Students/StudentList';
import Sidebar from './components/Admin/Sidebar';
import AdminControl from './components/Admin/AdminControl';
import StudentReport from './components/Students/GetStuReport';
import DownloadAttendance from './components/Attendance/DownloadAttendance';
import AddEditStudent from './components/Students/AddEditStudent';
import CalendarView from './components/Students/CalendarView';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeComponent, setActiveComponent] = useState('dashboard'); // Default to Dashboard

  // Check if token exists on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token); // Set to true if token exists, false otherwise
  }, []);

  // Handle logout functionality
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminId');
    setIsLoggedIn(false);
  };

  // Layout for Sidebar Components
  const SidebarLayout = () => (
    <div className="app-container d-flex">
      <Sidebar
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        activeComponent={activeComponent}
        setActiveComponent={setActiveComponent}
        isSidebarOpen={true}
      />
      <div className="main-content with-sidebar" style={{ flex: 1, marginTop: "65px" }}>
        <Outlet />
      </div>
    </div>
  );

  return (
    <Router>
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <LoadingBar color='#fc0000' progress={100} />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<AdminLogin setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/admin/Kss-kSS/2025-reg/owner-wibix" element={<AdminRegister />} />

        {/* Protected Routes */}
        <Route element={<SidebarLayout />}>
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students/add-student"
            element={
              <ProtectedRoute>
                <AddEditStudent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students/edit-student/:id"
            element={
              <ProtectedRoute>
                < AddEditStudent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance/scan-student"
            element={
              <ProtectedRoute>
                <ScanAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance/view-attendance"
            element={
              <ProtectedRoute>
                <ViewAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students/report"
            element={
              <ProtectedRoute>
                <StudentReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar-view/:barcode"
            element={
              <ProtectedRoute>
                <CalendarView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <StudentList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance/download"
            element={
              <ProtectedRoute>
                <DownloadAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/control-panel"
            element={
              <ProtectedRoute>
                <AdminControl />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
