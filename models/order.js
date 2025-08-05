const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
  orderItems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderItem",
      required: true,
    },
  ],
  shippingAddress1: {
    type: String,
    required: true,
  },
  shippingAddress2: {
    type: String,
  },
  city: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  phone: {
  type: String,
  required: true,
  match: /^[0-9]{11}$/ // يسمح فقط بـ 11 رقم
},
  state: {
    type: String,
    required: true,
    default: "pending",
  },
  totalPrice: {
    type: Number,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  

} ,{ timestamps: true });


orderSchema.virtual('id').get(function () {
    return this._id.toHexString();
})
orderSchema.set('toJSON' , {
    virtuals: true ,
})

exports.Order = mongoose.model("Order", orderSchema);
