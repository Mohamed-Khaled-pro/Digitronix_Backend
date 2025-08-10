const express = require('express');
const router = express.Router();
const {Category} = require('../models/category')
const multer = require("multer");
const fs = require("fs");
const requireAdmin = require('../helpers/requireAdmin')
// ✅ لو المجلد مش موجود نعمله تلقائيًا
const uploadPath = "public/uploads";
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = isValid ? null : new Error("Invalid image type");
    cb(uploadError, uploadPath);
  },
  filename: function (req, file, cb) {
    const extension = FILE_TYPE_MAP[file.mimetype];
    const filename = file.originalname.split(".")[0].replace(/\s/g, "-");
   cb(null, `${filename}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });


router.get(`/`, async (req, res) => {
        const categoryList = await Category.find();
        if(!categoryList)
            return res.status(500).json({message: 'No products found', success : false})
        res.status(200).send(categoryList)
        
});

router.get('/:id' , async (req, res) => {
    const id = req.params.id;
    const category = await Category.findById(id);
    if(!category)
        return res.status(404).json({message: 'Category not found', success : false})
    res.status(200).send(category)
    })

router.post(`/`, requireAdmin,uploadOptions.single("image"), async (req, res) => {
   console.log("File:", req.file);
  console.log("Body:", req.body);
    const file = req.file;
  
    if (!file) {
      return res.status(400).json({ message: "No image file provided", success: false });
    }
  
    const fileName = file.filename;
const basePath = `${process.env.BASE_URL}/public/uploads/`;  
    let category = new Category({
      name: req.body.name,
      image: `${basePath}${fileName}`,
    });
  
    category = await category.save();
    if (!category) {
      return res.status(400).json({ message: "Failed to create category", success: false });
    }
    res.send(category);

});



router.put('/:id', uploadOptions.single("image"), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found", success: false });
    }

    const file = req.file;
    let imagePath = category.image; // default to old image

    if (file) {
const basePath = `${process.env.BASE_URL}/public/uploads/`;      imagePath = `${basePath}${file.filename}`;
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


router.delete('/:id' , (req , res) =>{
    Category.findByIdAndDelete(req.params.id).then(category =>{
        if(category){
            res.status(200).json({message: 'Category deleted', success : true})
        } else {
            res.status(404).json({message: 'Category not found', success : false})
        }
    }).catch(err =>  {
           res.status(400).json({message: 'Failed to delete category', error: err , success:false })
    })
    
})


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

module.exports = router