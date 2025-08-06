const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Product } = require("../models/product");
const { Category } = require("../models/category");
const multer = require("multer");
const fs = require("fs");
const requireAdmin = require("../helpers/requireAdmin")
require("dotenv").config();

const Url = process.env.BASE_URL || "http://localhost:3000"; // عدل المنفذ إذا كان غير 3000


// إنشاء مجلد التخزين لو مش موجود
const uploadPath = "public/uploads";
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}
// أنواع الصور المقبولة
const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

// إعداد التخزين
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = isValid ? null : new Error("Invalid image type");
    cb(uploadError, uploadPath);
  },
  filename: function (req, file, cb) {
    const extension = FILE_TYPE_MAP[file.mimetype];
    const fileName = file.originalname.split(" ").join("-");
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

// ✅ إنشاء منتج جديد
router.post(`/`, uploadOptions.single("image"), requireAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.body.category);
    if (!category)
      return res.status(400).send({ message: "❌ Invalid Category" });

    if (!req.file)
      return res.status(400).send({ message: "❌ Image is required" });

    const fileName = req.file.filename;
    // بناء الرابط الكامل للملف باستخدام متغير البيئة
const basePath = `${Url}/public/uploads/`;
    const product = new Product({
      name: req.body.name,
      description: req.body.description,
      richdescription: req.body.richdescription,
      image: `${basePath}${fileName}`,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    });

    const savedProduct = await product.save();

    if (!savedProduct)
      return res.status(400).send({ message: "❌ The product cannot be created" });

    res.status(201).send(savedProduct);
  } catch (err) {
    console.log("💥 Error:", err.message);
    res.status(500).send({ message: "Internal Server Error", error: err.message });
  }
});

// ✅ الحصول على كل المنتجات
router.get(`/`, async (req, res) => {
  try {
    let filter = {};
    if (req.query.categories) {
      filter = { category: req.query.categories.split(",") };
    }

    let productList = await Product.find(filter)
      .select("name description image brand price category rating isFeatured")
      .populate("category");

    productList = productList.sort(() => 0.5 - Math.random());

    if (!productList) {
      return res.status(404).json({ message: "No products found", success: false });
    }

    res.status(200).send(productList);
  } catch (err) {
    res.status(500).json({
      message: "Failed to get products",
      error: err.message,
      success: false,
    });
  }
});

// ✅ البحث عن منتج
router.get('/search', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || keyword.trim() === "") {
      return res.status(200).json([]);
    }

    const filter = {
      name: { $regex: keyword, $options: 'i' },
    };

    const products = await Product.find(filter)
      .select("name description image brand price category rating isFeatured")
      .populate("category", "name");

    return res.status(200).json(products);
  } catch (err) {
    console.error("❌ Search Error:", err);
    return res.status(500).json({
      success: false,
      message: '❌ Failed to search products',
      error: err.message,
    });
  }
});

// ✅ منتج واحد
router.get(`/:id`, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found", success: false });
    }
    res.status(200).send(product);
  } catch (err) {
    res.status(500).json({
      message: "Failed to get product",
      error: err.message,
      success: false,
    });
  }
});

// ✅ حذف منتج
router.delete("/:id",requireAdmin, (req, res) => {
  Product.findByIdAndDelete(req.params.id)
    .then((product) => {
      if (product) {
        res.status(200).json({ message: "Product deleted", success: true });
      } else {
        res.status(404).json({ message: "Product not found", success: false });
      }
    })
    .catch((err) => {
      res.status(400).json({
        message: "Failed to delete Product",
        error: err,
        success: false,
      });
    });
});

// ✅ تعديل منتج
router.put("/:id",requireAdmin, uploadOptions.single("image"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid product id", success: false });
  }

  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send({ message: "Invalid Category" });

  let product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found", success: false });
  }

  let imagePath = product.image;
  if (req.file) {
    const fileName = req.file.filename;
const basePath = `${Url}/public/uploads/`;    imagePath = `${basePath}${fileName}`;
  }

  product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: imagePath,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    },
    { new: true }
  );

  if (!product)
    return res
      .status(500)
      .json({ message: "Failed to update product", success: false });

  res.send(product);
});

// ✅ عدد المنتجات
router.get("/get/count",async (req, res) => {
  try {
    const productCount = await Product.countDocuments();
    res.status(200).send({ productCount });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching product count",
      error: err.message,
    });
  }
});

// ✅ المنتجات المميزة
router.get("/get/featured", async (req, res) => {
  try {
    const productFeatured = await Product.find({ isFeatured: true });
    if (!productFeatured)
      return res
        .status(404)
        .json({ message: "No featured products found", success: false });

    res.send(productFeatured);
  } catch (err) {
    res.status(500).json({
      message: "Failed to get featured products",
      error: err.message,
      success: false,
    });
  }
});

module.exports = router;
