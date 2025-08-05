const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  richdescription: {
    type: String,
    trim: true,
    default: "",
  },
  image: {
    type: String,
    required: true,
    default: "",
  },
  images: {
    type: Array,
    default: [],
  },
  brand: {
    type: String,
    required: true,
    default: "",
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },

  countInStock: {
    type: Number,
    required: true,
    min: 0,
    max: 200,
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  numReviews: {
    type: Number,
    default: 0,
  },
  dataCreated: {
    type: Date,
    default: Date.now,
  },
});
productSchema.virtual('id').get(function () {
    return this._id.toHexString();
})
productSchema.set('toJSON' , {
    virtuals: true ,
})
exports.Product = mongoose.model("Product", productSchema);
