const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
      key: { "email": 1 }
  },
  passwordHash: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  country: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  street: {
    type: String,
    required: true,
  },
  apartment: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});
userSchema.virtual('id').get(function () {
    return this._id.toHexString();
})
userSchema.set('toJSON', {          // الهدف هنا إن بدل ما ترجع _id بشكل الـ ObjectId المعقد، ترجع id كـ String جاهز للاستخدام.
    virtuals: true,
    });
exports.User = mongoose.model("User", userSchema);
