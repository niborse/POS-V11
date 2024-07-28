const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const productSchema = new mongoose.Schema({
    class: String,
    name: String,
    price: Number,
    barcode: Number,
    margin: Number,
    profit: Number
});

const Product = mongoose.model('Product', productSchema);

app.get('/item/:class', async (req, res) => {
    try {
        const itemClass = req.params.class;
        const item = await Product.findOne({ class: itemClass }, 'name price barcode');
        if (item) {
            res.json(item);
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

mongoose.connect('mongodb+srv://nvborse1812:Iloveworkinginthecontrolroom@cluster1.tqaxbvl.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster1', 
    { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => app.listen(3000, () => console.log('Server started on port 3000')))
    .catch(error => console.log(error));
