const mongoose = require('mongoose');
const { Product } = require('./models/product'); // تأكد إن المسار صحيح
require('dotenv').config();

// إعداد الاتصال بقاعدة البيانات
const mongoUri = process.env.CONNECTION_BASE || 'mongodb+srv://mohamedkhaled:mazoorl123@cluster0.ecqsl2x.mongodb.net/mydatabase?retryWrites=true&w=majority';

mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 30000 })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function updateImageUrls() {
  try {
    // استني اكتمال الاتصال
    await new Promise((resolve) => {
      mongoose.connection.on('open', resolve);
    });

    // تحقق من المجموعات المتاحة
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    const products = await Product.find();
    console.log(`Found ${products.length} products`);

    if (products.length === 0) {
      console.log('No products found in the database. Please check the database, collection name, or add products.');
      process.exit(0);
    }

    let updatedCount = 0;

    for (const product of products) {
      console.log(`Checking product: ${product.name}, Image: ${product.image}`);
      // تحقق لو رابط الصورة قديم
      if (product.image && (product.image.includes('localhost') || product.image.startsWith('http://'))) {
        const newImageUrl = product.image
          .replace('http://localhost:3000', NEW_BASE_URL)
          .replace('http://', 'https://')
          .replace(/https?:\/\/[^\/]+/, NEW_BASE_URL);
        product.image = newImageUrl;
        await product.save();
        updatedCount++;
        console.log(`Updated product ${product.name}: ${newImageUrl}`);
      } else {
        console.log(`No update needed for product ${product.name}`);
      }
    }

    console.log(`Finished updating ${updatedCount} products`);
    process.exit(0);
  } catch (err) {
    console.error('Error updating image URLs:', err.message);
    process.exit(1);
  }
}

// النطاق الصحيح لـ Railway
const NEW_BASE_URL = process.env.BASE_URL || 'https://backend-production-b65ae.up.railway.app';

updateImageUrls();