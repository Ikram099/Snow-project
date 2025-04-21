const mongoose = require('mongoose');

const ProductOfferingSchema = new mongoose.Schema({
  display_name: String,
  offering_type: String,
  start_date: String,
  status: String,
  description: String,
}, { timestamps: true });

// 👉 On précise ici la collection manuellement
module.exports = mongoose.model('ProductOffering', ProductOfferingSchema, 'product_offerings');
