const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');

// Load SSL certificate and key
const server = https.createServer({
    cert: fs.readFileSync('/Users/nikhilborse/Documents/groceries-items-v1/pos_website_v4/Client/server.cert','utf8'), // path to your certificate
    key: fs.readFileSync('/Users/nikhilborse/Documents/groceries-items-v1/pos_website_v4/Client/server.key', 'utf8') // path to your private key
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Handle WebSocket connection
wss.on('connection', (ws) => {
    console.log('WebSocket connection established.');

    // Handle messages from the client
    ws.on('message', (message) => {
        console.log('Received message:', message);
    });

    // Send a message to the client
    ws.send('Hello from the WebSocket server!');

    // Handle WebSocket errors
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    // Handle WebSocket closure
    ws.on('close', (code, reason) => {
        console.log(`WebSocket connection closed: ${code} - ${reason}`);
    });
});

// Start the HTTPS server
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server is listening on https://localhost:${PORT}`);
});
