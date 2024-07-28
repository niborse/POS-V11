const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5009; // Change the port number here

app.use(bodyParser.json());

const products = {};

app.post('/products', (req, res) => {
    const { name, price, barcode } = req.body;
    products[barcode] = { name, price };
    res.status(201).json({ message: 'Product added successfully' });
});

app.put('/products/:barcode', (req, res) => {
    const { barcode } = req.params;
    const { name, price } = req.body;
    if (products[barcode]) {
        products[barcode] = { name, price };
        res.json({ message: 'Product updated successfully' });
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
