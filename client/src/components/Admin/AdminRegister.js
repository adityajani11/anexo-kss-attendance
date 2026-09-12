import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AdminRegister() {
  const [formData, setFormData] = useState({
    username: '',
    contact: '',
    emailId: '',
    password: '',
    confirmPassword: '',
    verificationPassword: '',
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match. Please re-enter.');
      return;
    }

    // Validation: Check if password and verification password are different
    if (formData.password === formData.verificationPassword) {
      alert('Password and verification password must be different.');
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/register`, {
        username: formData.username,
        contact: formData.contact,
        emailId: formData.emailId,
        password: formData.password,
        verificationPassword: formData.verificationPassword,
      });

      alert('Admin registered successfully');
      navigate('/'); // Redirect to login page after successful registration
    } catch (error) {
      alert('Error registering admin: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm" style={{ marginTop: 100}}>
            <div className="card-body">
              <h2 className="text-center">Admin Registration</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className="form-control"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleChange}
                    maxLength="30"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="contact" className="form-label">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    id="contact"
                    name="contact"
                    className="form-control"
                    placeholder="Enter your contact number"
                    value={formData.contact}
                    onChange={handleChange}
                    required
                    maxLength="10"
                    pattern="\d{10}"
                    title="Please enter a valid 10-digit contact number"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="emailId" className="form-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="emailId"
                    name="emailId"
                    className="form-control"
                    maxLength="60"
                    placeholder="Enter your email address"
                    value={formData.emailId}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="form-control"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="6"
                    title="Password must be at least 6 characters long"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    className="form-control"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="verificationPassword" className="form-label">
                    Verification Password
                  </label>
                  <input
                    type="password"
                    id="verificationPassword"
                    name="verificationPassword"
                    className="form-control"
                    placeholder="Enter a different verification password"
                    minLength="6"
                    title="Verification password must be at least 6 characters long"
                    value={formData.verificationPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  Register
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminRegister;
