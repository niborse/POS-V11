const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(bodyParser.json());``
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

app.get('/', (req, res) => res.send('API is running'));

app.post('/sales', (req, res) => {
  console.log('Received new sale:', req.body); // Debugging line
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

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



  //const mongoURI = 'mongodb+srv://nvborse1812:Iloveworkinginthecontrolroom@cluster1.tqaxbvl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1';