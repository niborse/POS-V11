const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'hotmail',
  auth: {
    user: 'nvborse121@hotmail.com',
    pass: 'JOKER123'
  }
});

const mailOptions = {
    from: 'nvborse121@hotmail.com',
    to: 'nvborse1812@gmail.com',
    subject: 'Test Email',
    text: 'This is a test email.'
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.error('Error sending email:', error);
  }
  console.log('Email sent:', info.response);
});
