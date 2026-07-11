require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");

const app = express();

// =====================
// Middlewares
// =====================

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://digitronix-frontend.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(morgan("combined"));
app.use(compression());


// Logger
app.use((req, res, next) => {
  console.log(
    `✅ ${req.method} ${req.url} - ${new Date().toISOString()}`
  );
  next();
});


// =====================
// Database
// =====================

mongoose
  .connect(process.env.CONNECTION_BASE, {
    dbName: "mydatabase",
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB");
    console.log("Database:", mongoose.connection.name);
  })
  .catch((err) => {
    console.log("❌ Database Error:", err.message);
  });


// =====================
// Test Route
// =====================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Hello from Digitronix Backend 🚀",
  });
});


// =====================
// Helpers
// =====================

const authJwt = require("../helpers/jwt");
const errorHandler = require("../helpers/error-handler");


// JWT Middleware
app.use(authJwt());


// =====================
// Routes
// =====================

const productsRoutes = require("../routes/products");
const usersRoutes = require("../routes/users");
const ordersRoutes = require("../routes/orders");
const categoriesRoutes = require("../routes/categories");


app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/orders", ordersRoutes);


// =====================
// Error Handler (LAST)
// =====================

app.use(errorHandler);


// =====================
// Server
// =====================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});