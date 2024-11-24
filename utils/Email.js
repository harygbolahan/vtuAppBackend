const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const email = process.env.EMAIL;
  const password = process.env.EMAIL_PASSWORD;
  // Creating email transport
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: email,
      pass: password,
    },
  });

  // configure email options
  const mailOptions = {
    from: "VTU App <pacedigitals2019@gmail.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  //   Send the mail
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
