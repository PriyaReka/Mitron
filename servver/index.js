require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB Connected to Atlas'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes

app.use('/api/auth', require('./routes/auth'));
app.use('/api/data', require('./routes/api'));


app.get('/', (req, res) => {
    res.send('MITRON API is Running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
