const mongoose = require('mongoose');

const cartSchema = mongoose.Schema({
    product_id : { type : String , require : true},
    price : { type : Number , require : true},
});

module.exports = mongoose.model("Cart",cartSchema);