const express = require('express');
const router = express.Router();
const { User } = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const requireAdmin = require('../helpers/requireAdmin');
router.get(`/`, async (req, res) => {
        const userList = await User.find().select('-passwordHash');
        if (!userList || userList.length === 0) {
            return res.status(404).json({ message: 'No users found', success: false });
        }
        res.status(200).send(userList);
});

router.get('/:id' , async (req, res) => {
    const id = req.params.id;
    const user = await User.findById(id).select('-passwordHash'); // -(anything) will excluded
    if(!user)
        return res.status(404).json({message: 'User not found', success : false})
    res.status(200).send(user)
    })


router.post('/register', async (req, res) => {
  try {

  const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).send({ success: false, message: "Invaild Email or Password " });
    }

    let user = new User({
      name: req.body.name,
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
      phone: req.body.phone,
      country: req.body.country,
      city: req.body.city,
      street: req.body.street,
      apartment: req.body.apartment,
      isAdmin: req.body.isAdmin
    });

    user = await user.save();
    res.status(201).send(user);
  } catch (err) {
    console.error("Register Error =>", err); // <== لازم دي تكون موجودة
    res.status(500).send({ success: false, message: "Register Failed", error: err.message });
  }
});


 router.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const secret = process.env.secret;
    console.log("BODY:", req.body); // ✅ اطبع هنا


  if (!user) {
    return res.status(400).json({ message: 'User not found', success: false });
  }

  const isValidPassword = bcrypt.compareSync(req.body.password, user.passwordHash);
  if (!isValidPassword) {
    return res.status(400).json({ message: 'Invalid password', success: false });
  }

  // ✅ إنشاء التوكن
  const token = jwt.sign(
    { userId: user.id, isAdmin: user.isAdmin },
    secret,
    { expiresIn: '2d' }
  );

res.cookie("token", token, {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 2 * 24 * 60 * 60 * 1000,
})
    .status(200)
    .json({
      message: "Login successful",
        user: {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    country:user.country,
    city:user.city ,
    street:user.street , 
    apartment: user.apartment,
    isAdmin: user.isAdmin
  }
    });
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "strict" });
  return res.status(200).json({ message: "Logged out successfully" }); 
});

 router.get("/get/count",requireAdmin, async (req, res) => {
   try {
     const userCount = await User.countDocuments(); 
     res.status(200).send({ userCount });
   } catch (err) {
     res.status(500).json({
       success: false,
       message: "Error fetching user count ",
       error: err.message,
     });
   }
 });
 



router.delete("/:id", requireAdmin,(req, res) => {
  User.findByIdAndDelete(req.params.id)
    .then((user) => {
      if (user) {
        res.status(200).json({ message: "user deleted", success: true });
      } else {
        res.status(404).json({ message: "user not found", success: false });
      }
    })
    .catch((err) => {
      res
        .status(400)
        .json({
          message: "Failed to delete user",
          error: err,
          success: false,
        });
    });
});

module.exports = router;
