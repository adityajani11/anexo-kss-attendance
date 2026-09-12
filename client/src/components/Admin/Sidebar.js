import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import "../style/Sidebar.css";
import Swal from 'sweetalert2';

// Date and Time Display Component
const DateTimeDisplay = () => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setDateTime(new Date()); // Update to the current system time
    }, 1000);

    return () => clearInterval(interval); // Clear interval on component unmount
  }, []);

  const formattedDate = dateTime.toLocaleDateString('en-GB'); // DD-MM-YYYY
  const formattedTime = dateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div className="date-time-display text-start">
      <div className="mb-2">
        <span className="text-white fw-bold fs-5">
          <i className="bi bi-calendar me-2"></i>
          {formattedDate}
        </span>
      </div>
      <div>
        <span className="text-white fw-bold fs-5">
          <i className="bi bi-clock me-2"></i>
          {formattedTime}
        </span>
      </div>
    </div>
  );
};

function Sidebar({ isLoggedIn, onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar is initially closed
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();
  const location = useLocation(); // Track current location (page)

  // Handle logout functionality
  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, logout!',
      cancelButtonText: 'No, cancel!',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('token');
        onLogout();
        navigate('/');
      }
    });
  };

  const handleResize = () => {
    setWindowWidth(window.innerWidth);
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Auto-close the sidebar on window resize
  useEffect(() => {
    if (windowWidth >= 992) {
      setIsSidebarOpen(true); // Sidebar will open by default for larger screens
    } else {
      setIsSidebarOpen(false); // Sidebar will be closed for smaller screens
    }
  }, [windowWidth]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getActiveClass = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  // Handle page redirection and close sidebar only for mobile view (small screens)
  const handleLinkClick = (path) => {
    if (windowWidth < 992) {
      setIsSidebarOpen(false); // Close sidebar on mobile view after clicking a link
    }
    navigate(path); // Redirect to the desired page
  };

  return (
    <>
      {windowWidth < 992 && (
        <button
          className={`sidebar-toggle-btn ${isSidebarOpen ? 'd-none' : ''}`}
          onClick={toggleSidebar}
        >
          <i className='fa fa-bars' aria-hidden='true'></i>
        </button>
      )}

      <div className={`sidebar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {windowWidth < 992 && isSidebarOpen && (
          <button
            className="sidebar-close-btn"
            onClick={toggleSidebar}
          >
            <i className="fa fa-times" aria-hidden="true"></i>
          </button>
        )}

        <div className="h-100">
          <div className="card-body">
            <div className="d-flex p-1 ps-2 bg-secondary rounded flex-column mb-3">
              <DateTimeDisplay />
            </div>
            <hr className="text-white" />
            <div className="d-flex flex-column mb-3">
              {/* Sidebar links */}
              <Link
                to="/admin/dashboard"
                className={`btn mb-2 d-flex align-items-center ${getActiveClass('/admin/dashboard')}`}
                onClick={() => handleLinkClick('/admin/dashboard')}
              >
                <i className="fas fa-tachometer-alt me-2"></i> Dashboard
              </Link>
              <Link
                to="/students/add-student"
                className={`btn mb-2 d-flex align-items-center ${getActiveClass('/students/add-student')}`}
                onClick={() => handleLinkClick('/students/add-student')}
              >
                <i className="fas fa-user-plus me-2"></i> Add Student
              </Link>
              <Link
                to="/students"
                className={`btn mb-2 d-flex align-items-center ${getActiveClass('/students')}`}
                onClick={() => handleLinkClick('/students')}
              >
                <i className="fas fa-list me-2"></i> Student Data
              </Link>
              <Link
                to="/attendance/scan-student"
                className={`btn mb-2 d-flex align-items-center ${getActiveClass('/attendance/scan-student')}`}
                onClick={() => handleLinkClick('/attendance/scan-student')}
              >
                <i className="fas fa-camera me-2"></i> Scan Attendance
              </Link>
              <Link
                to="/attendance/view-attendance"
                className={`btn mb-2 d-flex align-items-center ${getActiveClass('/attendance/view-attendance')}`}
                onClick={() => handleLinkClick('/attendance/view-attendance')}
              >
                <i className="bi bi-person-vcard me-2"></i> View Attendance
              </Link>
              <Link
                to="/students/report"
                className={`btn mb-2 d-flex align-items-center ${getActiveClass('/students/report')}`}
                onClick={() => handleLinkClick('/students/report')}
              >
                <i className="bi bi-file-earmark-person me-2"></i> View Student Report
              </Link>
              <Link
                to="/attendance/download"
                className={`btn mb-2 d-flex align-items-center ${getActiveClass('/attendance/download')}`}
                onClick={() => handleLinkClick('/attendance/download')}
              >
                <i className="fa-solid fa-download me-2"></i> Download Attendance
              </Link>
              <Link
                to="/admin/control-panel"
                className={`btn mb-2 d-flex align-items-center ${getActiveClass('/admin/control-panel')}`}
                onClick={() => handleLinkClick('/admin/control-panel')}
              >
                <i className="fa-solid fa-exclamation-triangle me-2"></i> Admin Control
              </Link>
              {/* Login/Logout Button */}
              {isLoggedIn && (
                <div className="mb-4">
                  <button
                    className="btn btn-danger d-sm-inline d-block"
                    onClick={handleLogout}
                  >
                    <i className="fa fa-sign-out me-2" aria-hidden="true"></i>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
