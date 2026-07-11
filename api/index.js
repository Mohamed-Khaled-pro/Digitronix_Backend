const express = require("express");
const serverless = require("serverless-http");

const app = express();

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Digitronix Backend Working 🚀"
  });
});

module.exports = serverless(app);