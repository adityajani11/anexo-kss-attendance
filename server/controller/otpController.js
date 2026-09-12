const axios = require("axios");

exports.sendWhatsAppOtpMessage = async (req, res) => {
    const { receiver, otp } = req.body;

    // Validate request parameters
    if (!receiver || !otp) {
        return res.status(400).json({ error: "Receiver and OTP are required." });
    }

    // Template JSON
    const templateJson = {
        to: receiver,
        recipient_type: "individual",
        type: "template",
        template: {
            language: {
                policy: "deterministic",
                code: "en",
            },
            name: "send_otp_message",
            components: [
                {
                    type: "body",
                    parameters: [
                        {
                            type: "text",
                            text: otp, // Insert OTP
                        },
                    ],
                },
                {
                    type: "button",
                    sub_type: "url",
                    index: 0,
                    parameters: [
                        {
                            type: "text",
                            text: otp,
                        },
                    ],
                },
            ],
        },
    };

    try {
        const response = await axios.post(process.env.WHATSAPP_API_URL, templateJson, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.WHATAPI_TOKEN}`,
            },
        });

        // Respond with success
        return res.status(200).json({ message: "OTP sent successfully.", data: response.data });
    } catch (error) {
        // Handle error
        console.error(error.response?.data || error.message);
        return res.status(500).json({ error: "Failed to send OTP." });
    }
};
