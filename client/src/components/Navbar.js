import React from 'react';
import logo from '../logo/logo-trans.png';

const Navbar = () => {

  return (
    <nav className="navbar z-1000 position-fixed w-100 shadow-sm navbar-expand-lg navbar-light" style={{ backgroundColor: '#dbdbdb' }} >
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center w-100">
          {/* School Logo and Name */}
          <div className="d-flex align-items-center">
            <img
              src={logo}
              className="me-2"
              alt="School Logo"
              width={38}
              height={40}
            />
            <strong className="navbar-brand mb-0 text-nowrap">
              Krishna School
            </strong>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
