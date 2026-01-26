const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendMail = (req, res) => {
  const { name, contact, email, message } = req.body;

  const mailOptions = {
    from: email || process.env.MAIL_USER,
    to: process.env.MAIL_RECEIVER,
    subject: 'New Message from Contact Form',
    text: `Name: ${name}\nContact: ${contact}\nEmail: ${email}\nMessage: ${message}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send(error.toString());
    }
    res.send('Email sent: ' + info.response);
  });
};

module.exports = sendMail;
