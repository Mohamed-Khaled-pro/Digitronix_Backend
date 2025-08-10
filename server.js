require('dotenv').config();
const express = require('express');
const app = express();

const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const allowedOrigins = [
  "https://digitronix-store.netlify.app"
];
//hello
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
const api = process.env.API_URL;
const cookieParser = require("cookie-parser");
const compression = require('compression')
app.use(compression())



// Middlewares
app.use(cookieParser());
app.use(bodyParser.json());
app.use(morgan('combined'));
app.use((req, res, next) => {
  console.log(`✅ Incoming request: ${req.method} ${req.url} at ${new Date().toISOString()}`);
  console.log("✅ Request headers:", req.headers);
  console.log("✅ Request body:", req.body);
  console.log("✅ Request file:", req.file);
  next();
});
app.use( authJwt() ) 

const path = require('path');
app.use('/public/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/orders', ordersRoutes);
app.use(errorHandler)


// DB Connection
mongoose.connect(process.env.CONNECTION_BASE, {
    dbName: 'mydatabase',
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to database'))
.catch((err) => console.log('DB connection error:', err));

// Start Server
app.listen(port, () => {
    console.log(`API URL: ${api}`);
    console.log(`Server is running `);
});
