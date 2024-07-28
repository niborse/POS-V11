const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import CORS middleware

const app = express();
const port = 8000;
app.use(cors()); // Enable CORS for all routes

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Store messages temporarily (for demonstration purposes)
let messages = [];

// Endpoint to receive messages from mobile
app.post('/send', (req, res) => {
    const { message } = req.body;
    messages.push(message);
    console.log('Received message:', message);
    res.status(200).send('Message received successfully');
});

// Endpoint to send messages to computer
app.get('/receive', (req, res) => {
    res.json({ messages });
    // Optionally, clear messages after sending to computer
    messages = [];
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://192.168.0.101:${port}`);
});
