import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  // Handler to navigate to the login page
  const handleGetStarted = () => {
    navigate('/admin/login');
  };

  return (
    <>
      <header className="bg-primary text-white text-center py-5">
        <div className="container">
          <h1 className="display-4 py-5">Welcome to the Krishna School Attendance Portal</h1>
          <p className="lead">Simplifying attendance tracking with modern technology</p>
          <button className="btn btn-light btn-lg mt-3" onClick={handleGetStarted}>
            Get Started
          </button>
        </div>
      </header>

      <section className="features py-5">
        <div className="container">
          <h2 className="text-center mb-4">Key Features</h2>
          <div className="row">
            <div className="col-md-4 mb-4">
              <div className="card shadow-sm border-0">
                <div className="card-body text-center">
                  <i className="bi bi-person-check fs-1 text-primary mb-3"></i>
                  <h5 className="card-title">Barcode Scanning</h5>
                  <p className="card-text">Easily track student attendance with barcode scanning technology.</p>
                </div>
              </div>
            </div>

            <div className="col-md-4 mb-4">
              <div className="card shadow-sm border-0">
                <div className="card-body text-center">
                  <i className="bi bi-file-spreadsheet fs-1 text-primary mb-3"></i>
                  <h5 className="card-title">Dynamic Class Management</h5>
                  <p className="card-text">Manage classes and student groups with dynamic flexibility.</p>
                </div>
              </div>
            </div>

            <div className="col-md-4 mb-4">
              <div className="card shadow-sm border-0">
                <div className="card-body text-center">
                  <i className="bi bi-cloud-check fs-1 text-primary mb-3"></i>
                  <h5 className="card-title">Cloud-Based Storage</h5>
                  <p className="card-text">Securely store and access attendance data from anywhere.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
