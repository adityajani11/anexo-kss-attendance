import React from 'react'
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <>
            <div className="container">
                <footer className="d-flex flex-wrap justify-content-between align-items-center py-3 my-4 border-top">
                    <p className="col-md-4 mb-0 text-muted">© 2024 Krishna School Group, Inc</p>

                    <ul className="nav col-md-4 justify-content-end">
                        <li className="nav-item">
                            <Link to="/" className="nav-link px-2 text-muted">Home</Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/admin/login" className="nav-link px-2 text-muted">Admin Login</Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/students/add" className="nav-link px-2 text-muted">Add Student</Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/students" className="nav-link px-2 text-muted">View Students</Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/attendance/scan" className="nav-link px-2 text-muted">Scan Attendance</Link>
                        </li>
                    </ul>
                </footer>
            </div>
        </>
    );
}

export default Footer;
