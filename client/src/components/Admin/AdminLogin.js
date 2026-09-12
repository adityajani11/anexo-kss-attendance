import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from "../../logo/logo-trans.png";
import ForgotPasswordForm from './ForgotPasswordForm';

const AdminLogin = ({ setIsLoggedIn }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [disableButton, setDisableButton] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        if (loading) {
          setLoading(false);
          setError('Login request timed out. Please try again.');
        }
      }, 30000); // 30 seconds timeout

      return () => clearTimeout(timer); // Cleanup timer
    }
  }, [loading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDisableButton(true);

    try {
      const apiUrl = `${process.env.REACT_APP_API_URL}/api/admin/login`;
      const response = await axios.post(apiUrl, credentials);

      if (response.data && response.data.token && response.data.adminId) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('adminId', response.data.adminId);
        setIsLoggedIn(true);
        navigate('/admin/dashboard');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Invalid credentials. Please try again.';
      if (error.response?.status === 429) {
        setError('Too many login attempts. Please try again after 5 minutes.');
        setRemainingTime(300);
        startCountdown();
      } else {
        setError(errorMessage);
        setDisableButton(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = () => {
    const countdownTimer = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(countdownTimer);
          setDisableButton(false);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">
        {/* Left Side - 70% */}
        <div
          className="col-12 col-md-8 d-none d-md-flex flex-column justify-content-center align-items-center"
          style={{
            background: 'linear-gradient(to right, #FC466B, #3f5efb)',
            color: '#ffffff',
          }}
        >
          <h1 className="display-4 fw-bold mb-4 text-center">
            Welcome to the Krishna School Attendance System Portal
          </h1>
          <p className="lead w-75 text-center">
            Simplifying attendance tracking with modern technology.
          </p>
        </div>


        {/* Right Side - 30% */}
        <div className="col-12 col-md-4 d-flex flex-column justify-content-center  bg-white">
          <div className="w-100">
            <div className="card-body">
              <div className="text-center mb-2">
                <img src={logo} alt="img" width="100" height="100" />
              </div>
              <h1 className="text-center mb-4 text-muted fw-bold">
                Admin Login
              </h1>
              <form onSubmit={handleSubmit}>
                <div className="mb-4 d-flex align-items-center">
                  <i className="fa fa-user fa-lg me-3"></i>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className="form-control form-control-lg"
                    placeholder="Enter your username"
                    value={credentials.username}
                    onChange={handleChange}
                    autoComplete="true"
                    maxLength="40"
                    required
                  />
                </div>
                <div className="mb-3 d-flex align-items-center">
                  <i className="fa fa-lock fa-lg me-3"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    className="form-control form-control-lg"
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={handleChange}
                    maxLength="30"
                    required
                  />
                  <span
                    className="ms-3"
                    style={{
                      cursor: "pointer",
                      fontSize: "1.5rem",
                      color: "#6c757d",
                    }}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <i className="fa fa-eye-slash"></i>
                    ) : (
                      <i className="fa fa-eye"></i>
                    )}
                  </span>
                </div>
                <div>
                  <a
                    href="#!"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowForgotPassword(true);
                    }}
                  >
                    Forgot Username or Password?
                  </a>
                </div>
                {error && (
                  <div className="mt-2">
                    <div className="alert alert-danger">
                      <i className="fa fa-exclamation-triangle me-2"></i>
                      {error}
                    </div>
                  </div>
                )}
                <div className="d-grid mt-4">
                  <button className="btn btn-primary w-50 mx-auto" disabled={disableButton}>
                    {loading ? (
                      <span>
                        <i className="fa fa-spinner me-2 fa-spin" aria-hidden="true"></i> Logging in...
                      </span>
                    ) : disableButton ? (
                      <span>
                        <i className="fa fa-clock me-2" aria-hidden="true"></i> Try again in {formatTime(remainingTime)}
                      </span>
                    ) : (
                      <span>
                        <i className="fa fa-sign-in-alt me-2" aria-hidden="true"></i> Login
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* FORGOT PASSWORD FORM RENDER */}
      <ForgotPasswordForm
        isVisible={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
};

export default AdminLogin;
