require('dotenv').config();
console.log('API_URL is:', process.env.API_URL)
const express = require('express');
const app = express();

const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const allowedOrigins = [
  "http://localhost:3001", // للتطوير المحلي
  "https://digitronix-store.netlify.app" // للموقع المنشور
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
// digitronix-store.netlify.app
const productsRoutes = require('./routes/products')
const usersRoutes = require('./routes/users')
const ordersRoutes = require('./routes/orders')
const categoriesRoutes = require('./routes/categories');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');
const port = 3000;
const api = process.env.API_URL || '/api';
const cookieParser = require("cookie-parser");
const compression = require('compression')
app.use(compression())

// Middlewares
app.use(cookieParser());
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use( authJwt() ) // any request come will ask this function to check if the token is valid or not
app.use(errorHandler)
 app.use('/public/uploads', express.static(__dirname + '/public/uploads'));

// Routes
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/orders', ordersRoutes);


// DB Connection
mongoose.connect(process.env.CONNECTION_BASE, {
    dbName: 'mydatabase'
})
.then(() => console.log('Connected to database'))
.catch((err) => console.log(err));

// Start Server
app.listen(port, () => {
    console.log(`API URL: ${api}`);
    console.log(`Server is running on http://localhost:${port}`);
});
