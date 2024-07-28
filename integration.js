const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb+srv://nvborse1812:Iloveworkinginthecontrolroom@cluster1.tqaxbvl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1', { useNewUrlParser: true, useUnifiedTopology: true });

const itemSchema = new mongoose.Schema({
    class: String,
    name: String,
    price: Number,
    barcode: String
});

const Item = mongoose.model('Item', itemSchema);

app.use(cors()); // Enable CORS

// Define API endpoints
app.get('/api/item-price/:class', async (req, res) => {
    try {
        const itemClass = req.params.class;
        const item = await Item.findOne({ class: itemClass });
        if (item) {
            res.json({ price: item.price });
        } else {
            res.status(404).send('Item not found');
        }
    } catch (error) {
        res.status(500).send('Server error');
    }
});

app.get('/api/item-barcode/:class', async (req, res) => {
    try {
        const itemClass = req.params.class;
        const item = await Item.findOne({ class: itemClass });
        if (item) {
            res.json({ barcode: item.barcode });
        } else {
            res.status(404).send('Item not found');
        }
    } catch (error) {
        res.status(500).send('Server error');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
