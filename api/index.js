require("dotenv").config();

const express = require("express");
const serverless = require("serverless-http");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");

const app = express();


// CORS
app.use(cors({
  origin: "https://digitronix-frontend.vercel.app",
  credentials: true,
}));


// Middlewares
app.use(cookieParser());
app.use(express.json());
app.use(morgan("combined"));
app.use(compression());


// Logger
app.use((req, res, next) => {
  console.log(
    `✅ Incoming request: ${req.method} ${req.url} at ${new Date().toISOString()}`
  );
  next();
});


// Database Connection
mongoose
  .connect(process.env.CONNECTION_BASE, {
    dbName: "mydatabase",
  })
  .then(() => console.log("✅ Connected to database"))
  .catch((err) => console.log("❌ DB connection error:", err));



// Routes
const productsRoutes = require("../routes/products");
const usersRoutes = require("../routes/users");
const ordersRoutes = require("../routes/orders");
const categoriesRoutes = require("../routes/categories");

const authJwt = require("../helpers/jwt");
const errorHandler = require("../helpers/error-handler");


// JWT Middleware
app.use(authJwt());


// API Routes
app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/orders", ordersRoutes);


// Error Handler
app.use(errorHandler);


// Test Route
app.get("/", (req, res) => {
  res.json({
    message: "Hello from Digitronix Backend 🚀",
  });
});


// Vercel Export
module.exports = serverless(app);