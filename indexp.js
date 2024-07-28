// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
const mongoURI = 'mongodb+srv://nvborse1812:Iloveworkinginthecontrolroom@cluster1.tqaxbvl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Define schema for purchased items
const purchaseItemSchema = new mongoose.Schema({
  itemClass: String,
  quantity: Number,
  bestBefore: Date
});

const PurchaseItem = mongoose.model('PurchaseItem', purchaseItemSchema);

// POST endpoint for purchased items
app.post('/purchased', async (req, res) => {
  console.log('Received new purchase:', req.body);
  try {
    const newItem = {
      itemClass: req.body.itemClass,
      quantity: req.body.quantity,
      bestBefore: req.body.bestBefore
    };
    const newPurchase = new PurchaseItem(newItem);
    const savedPurchase = await newPurchase.save();
    res.json(savedPurchase);
  } catch (err) {
    console.error('Error saving purchase:', err);
    res.status(400).json('Error: ' + err);
  }
});

// GET endpoint for fetching all purchased items
app.get('/purchased', async (req, res) => {
  try {
    const purchasedItems = await PurchaseItem.find();
    res.json(purchasedItems);
  } catch (err) {
    console.error('Error fetching purchased items:', err);
    res.status(400).json('Error: ' + err);
  }
});

const PORT = process.env.PORT || 5006;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
