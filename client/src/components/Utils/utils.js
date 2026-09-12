// Utils for reusable functions
import axios from "axios";

// Get Admin Contact
export const getAdminContact = async () => {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error('Please login again');
        }

        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/get-contact`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.data.success) {
            return response.data.contact; // Return the admin's contact number
        } else {
            throw new Error(response.data.message || "Failed to retrieve contact number");
        }
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch admin contact number');
    }
};

// OTP generation
export const generateOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit numeric OTP
    sessionStorage.setItem("adminOtp", otp.toString()); // Store OTP as plain string
    return otp.toString().padStart(6, '0'); // Return padded OTP
};

// OTP Sending
export const sendOtp = async (receiver, otp) => {
    // Basic validation of inputs
    if (!receiver || !otp) {
        throw new Error("Receiver and OTP are required");
    }

    try {
        // Call the API to send the OTP
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/send-otp`, {
            receiver,
            otp
        });

        // Return the response data from the API
        return response.data;
    } catch (error) {
        throw new Error("Failed to send OTP. Please try again.");
    }
};

// OTP Verification
export const verifyOtp = async (otp) => {
    const storedOtp = sessionStorage.getItem("adminOtp"); // Retrieve OTP from session storage
    if (!storedOtp) {
        throw new Error('OTP has expired or is invalid.');
    }
    if (otp !== storedOtp) {
        throw new Error('Invalid OTP.');
    }
    // If OTP is valid, proceed with next logic
    sessionStorage.removeItem("adminOtp"); // Remove OTP from session storage after verification
};

export const verifyVerificationPassword = async (adminId, verificationPassword, jwtToken) => {
    try {
        const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/api/admin/verifyVerificationPassword`,
            { adminId, verificationPassword },
            {
                headers: { Authorization: `Bearer ${jwtToken}` },
            }
        );
        return response.data; // Return the response data
    } catch (error) {
        if (error.response && error.response.status === 401) {
            // Handle specific case of invalid password (401 - Unauthorized)
            throw new Error('Invalid password.');
        } else {
            // For other unexpected errors
            throw new Error('An unexpected error occurred. Please try again.');
        }
    }
};
