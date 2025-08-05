const express = require("express");
const router = express.Router();
const { Order } = require("../models/order");
const { OrderItem } = require("../models/order_item");
const requireAdmin = require("../helpers/requireAdmin")
// Get all orders
router.get(`/`,requireAdmin ,async (req, res) => {
  try {
    const orderList = await Order.find()
      .populate("user")
      .sort({ orderDate: -1 });

    if (!orderList) {
      return res.status(500).json({ message: "No Order found", success: false });
    }

    res.status(200).send(orderList);
  } catch (err) {
    res.status(404).json({ message: "Failed to get Order", error: err, success: false });
  }
});

// Get orders for specific user
router.get(`/get/user/:userid`, async (req, res) => {
  try {
    const userorderList = await Order.find({ user: req.params.userid }).populate({
      path: "orderItems",
      populate: {
        path: "product",
        populate: "category",
      },
    });

    if (!userorderList) {
      return res.status(500).json({ message: "No userorderList found", success: false });
    }

    res.status(200).send(userorderList);
  } catch (err) {
    res.status(404).json({ message: "Failed to get user orders", error: err, success: false });
  }
});

// Get order by ID
router.get(`/:id`, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user")
      .populate({
        path: "orderItems",
        populate: {
          path: "product",
          populate: "category",
        },
      })
      .sort({ orderDate: -1 });

    if (!order) {
      return res.status(500).json({ message: "No Order found", success: false });
    }

    res.status(200).send(order);
  } catch (err) {
    res.status(404).json({ message: "Failed to get Order", error: err, success: false });
  }
});

// Create order
router.post(`/`, async (req, res) => {
  const orderItemsIds = await Promise.all(
    req.body.orderItems.map(async (orderItem) => {
      let newOrderItem = new OrderItem({
        product: orderItem.product,
        quantity: orderItem.quantity,
      });
      newOrderItem = await newOrderItem.save();
      return newOrderItem._id;
    })
  );

  const totalPrices = await Promise.all(
    orderItemsIds.map(async (orderItemId) => {
      const orderItem = await OrderItem.findById(orderItemId).populate("product", "price");
      return orderItem.product.price * orderItem.quantity;
    })
  );

  const TotalOfAll = totalPrices.reduce((a, b) => a + b, 0);

  let order = new Order({
    orderItems: orderItemsIds,
    shippingAddress1: req.body.shippingAddress1,
    shippingAddress2: req.body.shippingAddress2,
    city: req.body.city,
    country: req.body.country,
    phone: req.body.phone,
    status: req.body.status,
    totalPrice: TotalOfAll,
    user: req.body.user,
  });

  order = await order.save();

  if (!order) {
    return res.status(400).json({ message: "Failed to create order", success: false });
  }

  res.send(order);
});


// Calculate total from cart
router.post('/calculate-total', async (req, res) => {
  const { cartItems } = req.body;

  try {
    const total = cartItems.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    res.json({ total });
  } catch (err) {
    res.status(500).json({ message: "Failed to calculate total", error: err });
  }
});


router.delete("/admin/:id", requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found", success: false });
    }

    await Promise.all(order.orderItems.map(itemId => 
      OrderItem.findByIdAndDelete(itemId)
    ));

    await order.deleteOne();

    return res.status(200).json({ message: "Order deleted permanently", success: true });
  } catch (err) {
    console.error("Admin delete error:", err);
    return res.status(500).json({ message: "Failed to delete order", error: err.message, success: false });
  }
});

// Update/Delete order (should be delete route not put)
router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found", success: false });
    }

    if (order.state === "delivered") {
      return res.status(400).json({ message: "Cannot cancel a delivered order", success: false });
    }

    // تحديث حالة الأوردر فقط
    order.state = "cancelled";
    await order.save();

    return res.status(200).json({ message: "Order cancelled", success: true, order });
  }catch (err) {
  console.error("Cancel order error:", err);  // اطبع الخطأ في الكونسول
  return res.status(500).json({ message: "Failed to cancel order", error: err.message, success: false });
}
});


// Total Sales
router.get("/get/totalsales",requireAdmin, async (req, res) => {
  const totalSales = await Order.aggregate([
       {
        $match: { state: "delivered" }, 
      },
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$totalPrice" },
      },
    },
  ]);

  const salesAmount = totalSales[0]?.totalSales || 0;

  res.json({ totalSales: salesAmount });
});

// Count Orders
router.get("/get/count", async (req, res) => {
  try {
    const orderCount = await Order.countDocuments({
  status: { $ne: "cancelled" }
    });

    res.status(200).send({ orderCount });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching order count",
      error: err.message,
    });
  }
});


router.put("/:id/state", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found", success: false });
    }

    order.state = req.body.state;
    await order.save();

    res.status(200).json({ message: "Order state updated", order, success: true });
  } catch (err) {
    console.error("Update order state error:", err);
    res.status(500).json({ message: "Failed to update order state", success: false });
  }
});
module.exports = router;
