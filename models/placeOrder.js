const mongoose = require('mongoose');

const placeOrderSchema = mongoose.Schema({
    product_id : { type : String , require : true},
    price : { type : Number , require : true},
    customerEmail : { type : String , require : true},
    sellerEmail : { type : String , require : true},
});

module.exports = mongoose.model("Order",placeOrderSchema);