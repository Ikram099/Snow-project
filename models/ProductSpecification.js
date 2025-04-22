const mongoose = require('mongoose');

const ProductSpecificationSchema = new mongoose.Schema({
    sys_id: String,
    display_name: String,
    specification_category: String,
    specification_type: String,
    start_date: String,
    description: String,
    status: String,
    cost_to_company: String,

}, { timestamps: true });



module.exports = mongoose.model('product_specifications', ProductSpecificationSchema);
