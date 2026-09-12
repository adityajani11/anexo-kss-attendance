import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Radio, message } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';
import { generateOtp, sendOtp, verifyOtp } from '../Utils/utils'; // Import utility functions

const ForgotPasswordForm = ({ isVisible, onClose }) => {
    const [form] = Form.useForm();
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [loading, setLoading] = useState(false);
    const [recoveryOption, setRecoveryOption] = useState('password');
    const [passwordVerified, setPasswordVerified] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [fetchedUsername, setFetchedUsername] = useState(""); // New state to store the fetched username

    useEffect(() => {
        if (!isVisible) {
            setOtpSent(false);
            setOtpVerified(false);
            setRecoveryOption('password');
            setPasswordVerified(false);
            setShowPassword(false);
            setFetchedUsername(""); // Reset the fetched username when modal is closed
        }
    }, [isVisible, form]);

    const handleValidateUserForOtp = async () => {
        form.validateFields(['contact', 'username'])
            .then(async () => {
                setLoading(true);
                const username = form.getFieldValue('username');
                const contact = form.getFieldValue('contact');

                try {
                    // Validate the username and contact before sending OTP
                    const validationResponse = await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/validate`, {
                        username,
                        contact
                    });

                    if (validationResponse.status === 200 && validationResponse.data.success) {
                        const otp = generateOtp(); // Generate OTP
                        await sendOtp(contact, otp); // Send OTP
                        message.success('OTP sent to the registered contact number.');
                        setOtpSent(true);
                    } else if (validationResponse.status === 400 || !validationResponse.data.success) {
                        message.error(validationResponse.data.message || 'Invalid username or contact number.');
                    } else {
                        message.error('Unexpected response from the server.');
                    }
                } catch (error) {
                    if (error.response) {
                        // Handle HTTP errors
                        message.error(error.response.data.message || 'Failed to validate username or contact.');
                    } else if (error.request) {
                        // Handle network errors (e.g., no response from the server)
                        message.error('Network error. Please try again later.');
                    } else {
                        // Handle other types of errors (e.g., setting up the request)
                        message.error(error.message || 'An error occurred.');
                    }
                } finally {
                    setLoading(false);
                }
            })
            .catch((errorInfo) => {
                const { contact, username } = errorInfo.errorFields.reduce((acc, { name, errors }) => {
                    acc[name] = errors;
                    return acc;
                }, {});
                if (contact) {
                    message.error(contact[0]);
                } else if (username) {
                    message.error(username[0]);
                } else {
                    message.error('Please fill out the required fields.');
                }
            });
    };

    const handleVerifyOtp = async () => {
        form.validateFields(['otp'])
            .then(async () => {
                setLoading(true);
                const otp = form.getFieldValue('otp');
                try {
                    await verifyOtp(otp); // Verify OTP
                    message.success('OTP verified successfully.');
                    setOtpVerified(true);
                } catch (error) {
                    message.error(error.message || 'Invalid OTP.');
                } finally {
                    setLoading(false);
                }
            })
            .catch(() => {
                message.error('Please enter the correct OTP.');
            });
    };

    const handleChangePassword = async () => {
        form.validateFields(['newPassword', 'confirmPassword'])
            .then(async (values) => {
                if (values.newPassword !== values.confirmPassword) {
                    message.error('Passwords do not match.');
                    return;
                }

                setLoading(true);
                try {
                    const username = form.getFieldValue('username');
                    const contact = form.getFieldValue('contact');
                    const newPassword = values.newPassword;

                    // Step 1: Call the validation API
                    const validationResponse = await axios.post(
                        `${process.env.REACT_APP_API_URL}/api/admin/validate`,
                        { username, contact }
                    );

                    // Step 2: If validation is successful, proceed with password change
                    if (validationResponse.status === 200) {
                        const response = await axios.post(
                            `${process.env.REACT_APP_API_URL}/api/admin/changePassword`,
                            { username, contact, newPassword }
                        );

                        if (response.status === 200) {
                            message.success('Password changed successfully.');
                            form.resetFields();
                            setOtpSent(false);
                            setOtpVerified(false);
                            onClose();
                        } else {
                            message.error(response.data.message || 'An error occurred.');
                        }
                    } else {
                        message.error('Invalid username or contact.');
                    }
                } catch (error) {
                    message.error(error.response?.data?.message || 'An error occurred while changing the password.');
                } finally {
                    setLoading(false);
                }
            })
            .catch(() => {
                message.error('Please fill out the required fields.');
            });
    };

    const handleVerifyPasswordForUsername = async () => {
        form.validateFields(['contact', 'password'])
            .then(async () => {
                setLoading(true);
                try {
                    const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/validate-admin-bycp`, {
                        contact: form.getFieldValue('contact'),
                        password: form.getFieldValue('password'),
                    });

                    if (response.status === 200) {
                        message.success(response.data.message || 'Password verified successfully.');
                        setPasswordVerified(true);
                    } else {
                        message.error(response.data.message || 'An error occurred.');
                    }
                } catch (error) {
                    const errorMessage = error.response?.data?.message || 'An error occurred while verifying your details.';
                    message.error(errorMessage);
                } finally {
                    setLoading(false);
                }
            })
            .catch(() => message.error('Incorrect contact number or password.'));
    };

    const handleFetchUsername = async () => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/fetch-username`, {
                contact: form.getFieldValue('contact')
            });

            if (response.data.username) {
                setFetchedUsername(response.data.username);
                message.success(response.data.message || 'Username fetched successfully.');
            } else {
                message.error(response.data.message || 'Username not found.');
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'An error occurred while fetching the username.');
        }
    };

    return (
        <Modal
            title="Forgot Username or Password"
            open={isVisible}
            onCancel={onClose}
            footer={null}
            maskClosable={false}
        >
            <Form form={form} layout="vertical">
                {!otpSent && (
                    <>
                        <Form.Item
                            name="recoveryOption"
                            initialValue={recoveryOption}
                        >
                            <Radio.Group
                                onChange={(e) => setRecoveryOption(e.target.value)}
                                value={recoveryOption}
                            >
                                <Radio id="forgotPassword" value="password">Forgot Password</Radio>
                                <Radio id="forgotUsername" value="username">Forgot Username</Radio>
                            </Radio.Group>
                        </Form.Item>

                        {recoveryOption === 'password' && (
                            <Form.Item
                                label="Username"
                                name="username"
                                rules={[{ required: true, message: 'Please enter your username' }]} >
                                <Input placeholder="Enter your username" maxLength={50} autoComplete="off" />
                            </Form.Item>
                        )}

                        <Form.Item
                            label="Registered Contact Number"
                            name="contact"
                            rules={[{ required: true, message: 'Please enter your contact number' },
                            { pattern: /^\d{10}$/, message: 'Enter a valid 10-digit number (without +91)' }]} >
                            <Input placeholder="Enter your registered contact number" maxLength={10} />
                        </Form.Item>

                        {recoveryOption === 'password' && (
                            <Button type="primary" onClick={handleValidateUserForOtp} loading={loading}>
                                Validate and Send OTP
                            </Button>
                        )}

                        {recoveryOption === 'username' && !passwordVerified && (
                            <>
                                <Form.Item
                                    label="Password"
                                    name="password"
                                    rules={[{ required: true, message: 'Please enter your password' }]} >
                                    <Input.Password
                                        placeholder="Enter your password"
                                        type={showPassword ? 'text' : 'password'}
                                        iconRender={visible => (
                                            visible ? <EyeOutlined onClick={() => setShowPassword(false)} /> : <EyeInvisibleOutlined onClick={() => setShowPassword(true)} />
                                        )}
                                    />
                                </Form.Item>
                                <Button type="primary" onClick={handleVerifyPasswordForUsername} loading={loading}>
                                    {loading ? "Verifying" : "Verify"} Password
                                </Button>
                            </>
                        )}
                    </>
                )}

                {recoveryOption === 'username' && passwordVerified && (
                    <Button type="primary" onClick={handleFetchUsername} loading={loading}>
                        Fetch Username
                    </Button>
                )}

                {otpSent && !otpVerified && recoveryOption === 'password' && (
                    <>
                        <Form.Item
                            label="OTP"
                            name="otp"
                            rules={[{ required: true, message: 'Please enter the OTP sent to your contact' }]} >
                            <Input placeholder="Enter OTP" />
                        </Form.Item>
                        <Button type="primary" onClick={handleVerifyOtp} loading={loading}>
                            Verify OTP
                        </Button>
                    </>
                )}

                {otpVerified && recoveryOption === 'password' && (
                    <>
                        <Form.Item
                            label="New Password"
                            name="newPassword"
                            rules={[{ required: true, message: 'Please enter a new password' }]} >
                            <Input.Password
                                placeholder="Enter new password"
                                type={showPassword ? 'text' : 'password'}
                                iconRender={visible => (
                                    visible ? <EyeOutlined onClick={() => setShowPassword(false)} /> : <EyeInvisibleOutlined onClick={() => setShowPassword(true)} />
                                )}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Confirm New Password"
                            name="confirmPassword"
                            rules={[{ required: true, message: 'Please confirm your new password' }]} >
                            <Input.Password
                                placeholder="Confirm new password"
                                type={showPassword ? 'text' : 'password'}
                                iconRender={visible => (
                                    visible ? <EyeOutlined onClick={() => setShowPassword(false)} /> : <EyeInvisibleOutlined onClick={() => setShowPassword(true)} />
                                )}
                            />
                        </Form.Item>
                        <Button type="primary" onClick={handleChangePassword} loading={loading}>
                            Change Password
                        </Button>
                    </>
                )}

                {passwordVerified && recoveryOption === 'username' && (
                    <Form.Item >
                        <h6 className="pt-2">Your username here</h6>
                        <Input id="username" className="fw-bold" autoComplete="on" value={fetchedUsername} disabled />
                    </Form.Item>
                )}
            </Form>
        </Modal>
    );
};

export default ForgotPasswordForm;
