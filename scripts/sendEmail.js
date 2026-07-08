const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail(to, subject, html) {
  try {
    console.log("Sending email...");
    console.log("From:", process.env.EMAIL_USER);
    console.log("To:", to);

    const info = await transporter.sendMail({
      from: `"ERecycloMatch" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent successfully!");
    console.log(info);
  } catch (err) {
    console.error("Email Error:");
    console.error(err);
  }
}

module.exports = sendEmail;