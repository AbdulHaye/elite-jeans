const nodemailer = require("nodemailer");
require("dotenv").config();

/**
 * Sends an email with multiple recipients, a workOrder ID in the email body, and attached PDFs.
 * @param {string} workOrder_Id - The work order ID to include in the email body.
 * @param {string[]} emails - Array of recipient email addresses.
 * @param {Array<{ filename: string, path: string }>} attachments - Array of attachment objects.
 * @returns {Promise<void>}
 */
const sendWorkOrderEmail = async (workOrder_Id, emails, attachments) => {
  try {
    // Setup email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your app password (not regular password)
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emails.join(","), // Convert array to comma-separated string
      subject: `Work Order Details - ${workOrder_Id}`,
      text: `Please find attached the Work Order details.\n\nWork Order ID: ${workOrder_Id}`,
      attachments: attachments, // Attach multiple PDF files
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw error;
  }
};

module.exports = { sendWorkOrderEmail };
