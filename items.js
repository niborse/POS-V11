
// mongodb+srv://nvborse1812:Iloveworkinginthecontrolroom@cluster1.tqaxbvl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 5009;

app.use(bodyParser.json());
app.use(cors());

const mongoURI = 'mongodb+srv://nvborse1812:Iloveworkinginthecontrolroom@cluster1.tqaxbvl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1';

mongoose.connect(mongoURI, {
  useNewUrlParser: true, // Remove this line
  useUnifiedTopology: true // Remove this line
})
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.error(err));



const itemSchema = new mongoose.Schema({
    name: String,
    price: Number,
    barcode: String
});

const Item = mongoose.model('Item', itemSchema);

app.use(bodyParser.json());
app.use(cors());

// Route to fetch item details by name
app.get('/items/:name', async (req, res) => {
    try {
        const item = await Item.findOne({ name: req.params.name });
        if (item) {
            res.json(item);
        } else {
            res.status(404).send('Item not found');
        }
    } catch (error) {
        res.status(500).send('Server error');
    }
});

// Route to fetch item details by barcode
app.get('/items/barcode/:barcode', async (req, res) => {
    try {
        const item = await Item.findOne({ barcode: req.params.barcode });
        if (item) {
            res.json(item);
        } else {
            res.status(404).send('Item not found');
        }
    } catch (error) {
        res.status(500).send('Server error');
    }
});

app.post('/items', async (req, res) => {
    const { name, price, barcode } = req.body;
    const newItem = new Item({ name, price, barcode });

    try {
        const savedItem = await newItem.save();
        res.json(savedItem);
    } catch (error) {
        res.status(500).send('Error saving item');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });