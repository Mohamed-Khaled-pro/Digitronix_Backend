require("dotenv").config();
const express = require("express");
const serverless = require("serverless-http");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");

const app = express();
app.use(cors());


// Middlewares
app.use(cookieParser());
app.use(bodyParser.json());
app.use(morgan("combined"));
app.use(compression());

app.use((req, res, next) => {
  console.log(`✅ Incoming request: ${req.method} ${req.url} at ${new Date().toISOString()}`);
  next();
});

// Routes
const productsRoutes = require("../routes/products");
const usersRoutes = require("../routes/users");
const ordersRoutes = require("../routes/orders");
const categoriesRoutes = require("../routes/categories");
const authJwt = require("../helpers/jwt");
const errorHandler = require("../helpers/error-handler");

app.use(authJwt());

app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/users", usersRoutes);// users
app.use("/api/orders", ordersRoutes);
app.use(errorHandler);

// Root route (for testing)
app.get("/", (req, res) => {
  res.json({ message: "Hello from Digitronix Backend 🚀" });
});

// DB Connection
mongoose.connect(process.env.CONNECTION_BASE, {
  dbName: "mydatabase",
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to database"))
.catch((err) => console.log("❌ DB connection error:", err));

// Export for Vercel
module.exports = app;
module.exports.handler = serverless(app);
