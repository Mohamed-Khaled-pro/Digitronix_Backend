const express = require('express');
const router = express.Router();
const { Category } = require('../models/category');
const multer = require("multer");
const requireAdmin = require('../helpers/requireAdmin');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Multer in memory (مش هنخزن على الهارد ديسك)
const storage = multer.memoryStorage();
const uploadOptions = multer({ storage });

// إعداد Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Function لرفع الصور إلى Cloudinary
function uploadToCloudinary(fileBuffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "categories" }, // تقدر تغير اسم الفولدر
      (error, result) => {
        if (result) {
          resolve(result.secure_url);
        } else {
          reject(error);
        }
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
}

// ✅ Get All Categories
router.get(`/`, async (req, res) => {
  const categoryList = await Category.find();
  if (!categoryList) {
    return res.status(500).json({ message: 'No categories found', success: false });
  }
  res.status(200).send(categoryList);
});

// ✅ Get Single Category
router.get('/:id', async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ message: 'Category not found', success: false });
  }
  res.status(200).send(category);
});

// ✅ Create Category
router.post(`/`, requireAdmin, uploadOptions.single("image"), async (req, res) => {
  try {
    let imageUrl = "";
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer);
    }

    let category = new Category({
      name: req.body.name,
      image: imageUrl,
    });

    category = await category.save();
    if (!category) {
      return res.status(400).json({ message: "Failed to create category", success: false });
    }
    res.send(category);
  } catch (err) {
    res.status(500).json({ message: "Error creating category", error: err.message });
  }
});

// ✅ Update Category
router.put('/:id', requireAdmin, uploadOptions.single("image"), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found", success: false });
    }

    let imagePath = category.image;
    if (req.file) {
      imagePath = await uploadToCloudinary(req.file.buffer);
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name || category.name,
        image: imagePath,
      },
      { new: true }
    );

    res.status(200).send(updatedCategory);
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});

// ✅ Delete Category
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (category) {
      res.status(200).json({ message: 'Category deleted', success: true });
    } else {
      res.status(404).json({ message: 'Category not found', success: false });
    }
  } catch (err) {
    res.status(400).json({ message: 'Failed to delete category', error: err, success: false });
  }
});

// ✅ Get Count
router.get("/get/count", async (req, res) => {
  try {
    const categoryCount = await Category.countDocuments();
    res.status(200).send({ categoryCount });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching category count",
      error: err.message,
    });
  }
});

module.exports = router;
