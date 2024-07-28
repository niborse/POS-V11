// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(bodyParser.json());
app.use(cors());


const mongoURI = 'mongodb+srv://nvborse1812:Iloveworkinginthecontrolroom@cluster1.tqaxbvl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1';
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

const itemSchema = new mongoose.Schema({
  itemName: String,
  quantity: Number,
  price: Number,
  totalPrice: Number
});

const saleSchema = new mongoose.Schema({
  paymentMethod: String,
  timestamp: { type: Date, default: Date.now },
  itemsSold: [itemSchema],
  totalAmount: Number
});

const Sale = mongoose.model('Sale', saleSchema);

const purchaseItemSchema = new mongoose.Schema({
  itemName: String,  // Changed from itemClass to itemName
  quantity: Number,
  bestBefore: Date
});

const PurchaseItem = mongoose.model('PurchaseItem', purchaseItemSchema);



app.post('/sales', (req, res) => {
  console.log('Received new sale:', req.body);
  const newSale = new Sale(req.body);
  newSale.save()
    .then(sale => res.json(sale))
    .catch(err => {
      console.error('Error saving sale:', err);
      res.status(400).json('Error: ' + err);
    });
});

app.get('/sales', async (req, res) => {
  try {
    const sales = await Sale.find();
    const formattedSales = sales.map(sale => ({
      ...sale.toObject(),
      _id: sale._id.toString()
    }));
    res.json(formattedSales);
  } catch (err) {
    console.error('Error fetching sales:', err);
    res.status(400).json('Error: ' + err);
  }
});

app.post('/purchased', async (req, res) => {
    console.log('Received new purchase:', req.body);
    try {
      const newItem = {
        itemName: req.body.itemName, // Ensure itemName is being received and saved
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

app.get('/purchased', async (req, res) => {
    try {
      const purchasedItems = await PurchaseItem.find();
      res.json(purchasedItems);
    } catch (err) {
      console.error('Error fetching purchased items:', err);
      res.status(400).json('Error: ' + err);
    }
});

app.get('/inventory', async (req, res) => {
  try {
    const sales = await Sale.find();
    const purchases = await PurchaseItem.find();

    // Calculate inventory
    const inventory = {};

    purchases.forEach(purchase => {
      if (!inventory[purchase.itemName]) {
        inventory[purchase.itemName] = {
          itemName: purchase.itemName,
          quantity: 0,
          bestBefore: purchase.bestBefore
        };
      }
      inventory[purchase.itemName].quantity += purchase.quantity;
    });

    sales.forEach(sale => {
      sale.itemsSold.forEach(item => {
        if (!inventory[item.itemName]) {
          inventory[item.itemName] = {
            itemName: item.itemName,
            quantity: 0
          };
        }
        inventory[item.itemName].quantity -= item.quantity;
      });
    });

    res.json(Object.values(inventory));
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(400).json('Error: ' + err);
  }
});

const PORT = process.env.PORT || 5010;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
