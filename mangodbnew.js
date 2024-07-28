const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Add this line to parse URL-encoded data
app.use(cors());

// MongoDB connection string
const mongoURI = 'mongodb+srv://nvborse1812:Iloveworkinginthecontrolroom@cluster1.tqaxbvl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1';

// Connect to MongoDB using Mongoose
mongoose.connect(mongoURI)
    .then(() => {
        console.log('MongoDB connected');
    })
    .catch(err => {
        console.error('Error connecting to MongoDB:', err);
    });

// Define the Product schema and model
const productSchema = new mongoose.Schema({
    class: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    barcode: { type: String, required: true },
    margin: { type: Number, required: true },
    profit: { type: Number, required: true }
});

const Product = mongoose.model('Product', productSchema);

// Endpoint to handle product entry
app.post('/products', async (req, res) => {
    try {
        const newProduct = new Product({
            class: req.body.class,
            name: req.body.name,
            price: req.body.price,
            barcode: req.body.barcode,
            margin: req.body.margin,
            profit: req.body.profit
        });

        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        console.error('Error saving product:', error);
        res.status(500).json({ message: 'Error saving product', error: error.message });
    }
});
app.get('/products', async (req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});




// const mongoURI = 'mongodb+srv://nvborse1812:Iloveworkinginthecontrolroom@cluster1.tqaxbvl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1';