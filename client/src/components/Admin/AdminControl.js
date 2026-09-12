import React, { useState } from 'react';
import DeleteDatabase from './AdminControl/DeleteDatabase';
import ChangeAdminPass from './AdminControl/ChangeAdminPass';
import ChangeVerificationPass from './AdminControl/ChangeVerificationPass';
import ChangeAdminContact from './AdminControl/ChangeAdminContact';
import ChangeUsername from './AdminControl/ChangeUsername';

const AdminControlPanel = () => {
  const [activeComponent, setActiveComponent] = useState(null);

  const renderActiveComponent = () => {
    switch (activeComponent) {
      case 'DeleteDatabase':
        return <DeleteDatabase />;
      case 'ChangeUsername':
        return <ChangeUsername />;
      case 'ChangeAdminPassword':
        return <ChangeAdminPass />;
      case 'ChangeVerificationPassword':
        return <ChangeVerificationPass />;
      case 'ChangeContact':
        return <ChangeAdminContact />;
      default:
        return <div className="text-center"><strong>Please select an option above.</strong></div>;
    }
  };

  return (
    <div className="container mt-2" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="alert alert-primary text-center">
        <h4 className="text-danger">
          <strong>ADMIN CONTROL PANEL</strong>
        </h4>
      </div>
      <div className="row mb-4">
        <div className="col-12 d-flex flex-wrap justify-content-center gap-2">
          <button
            type="button"
            className={`btn ${activeComponent === 'DeleteDatabase' ? 'btn-danger' : 'btn-outline-danger'} mx-2`}
            onClick={() => setActiveComponent('DeleteDatabase')}
          >
            <i className="fa-solid fa-database me-2"></i>
            Delete All Records
          </button>
          <button
            type="button"
            className={`btn ${activeComponent === 'ChangeUsername' ? 'btn-danger' : 'btn-outline-danger'} mx-2`}
            onClick={() => setActiveComponent('ChangeUsername')}
          >
            <i className="fa-solid fa-user me-2"></i>
            Change Username
          </button>
          <button
            type="button"
            className={`btn ${activeComponent === 'ChangeAdminPassword' ? 'btn-danger' : 'btn-outline-danger'} mx-2`}
            onClick={() => setActiveComponent('ChangeAdminPassword')}
          >
            <i className="fa-solid fa-user-circle me-2"></i>
            Change Password
          </button>
          <button
            type="button"
            className={`btn ${activeComponent === 'ChangeContact' ? 'btn-danger' : 'btn-outline-danger'} mx-2`}
            onClick={() => setActiveComponent('ChangeContact')}
          >
            <i className="fa-solid fa-phone me-2"></i>
            Change Contact Number
          </button>
          <button
            type="button"
            className={`btn ${activeComponent === 'ChangeVerificationPassword' ? 'btn-danger' : 'btn-outline-danger'} mx-2`}
            onClick={() => setActiveComponent('ChangeVerificationPassword')}
          >
            <i className="fa-solid fa-key me-2"></i>
            Change Verification Password
          </button>
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          <div className="card p-4 shadow-lg border-danger">
            {renderActiveComponent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminControlPanel;
