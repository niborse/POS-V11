const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const app = express();
const port = 5005;
const cors = require('cors');

app.use(cors());

app.use(bodyParser.json());

// Store timestamps of items that have triggered a low stock notification
let notifiedItems = {};

const transporter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
      user: 'nvborse121@hotmail.com',
      pass: 'JOKER123'
  }
});

function sendLowStockEmail(item) {
  const mailOptions = {
    from: 'nvborse121@hotmail.com',
    to: 'nvborse1812@gmail.com',
    subject: `Low Stock Alert: ${item.class}`,
    text: `The stock for item "${item.class}" is low. Current quantity: ${item.quantity}. Best before: ${item.bestBefore}.`
  };

  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
      // Update the timestamp for the item
      notifiedItems[item.class] = Date.now();
    }
  });
}

app.post('/update-inventory', (req, res) => {
  const inventory = req.body.inventory;
  const twelveHours = 12 * 60 * 60 * 1000;
  const now = Date.now();

  inventory.forEach(item => {
    if (item.quantity < 5) {
      // Check if we haven't sent a notification in the last 12 hours
      if (!notifiedItems[item.class] || now - notifiedItems[item.class] > twelveHours) {
        sendLowStockEmail(item);
      }
    }
  });

  res.json({ message: 'Inventory processed' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
