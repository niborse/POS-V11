const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 8080;

let detectedItems = [];

app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); // Parse application/json

app.post('/receive_items', (req, res) => {
    if (!req.body || !Array.isArray(req.body.items)) {
        return res.status(400).json({ error: 'Invalid request body format' });
    }

    detectedItems = req.body.items;
    console.log('Received items:', detectedItems);
    res.status(200).json({ message: 'Items received successfully' });
});

app.get('/items', (req, res) => {
    res.status(200).json(detectedItems);
});

app.post('/clear_items', (req, res) => {
    detectedItems = [];
    console.log('Detected items cleared');
    res.status(200).json({ message: 'Items cleared successfully' });
});


app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://192.168.0.103:${port}`);
});
