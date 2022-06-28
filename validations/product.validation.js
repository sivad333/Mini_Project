const joi = require('joi');
module.exports = {
    productValidation : data =>{
        const schema = joi.object({
            name : joi.string().min(3).max(30).required(),
            category_id : joi.number().required(),
            price : joi.number().required(),
            discount : joi.number().required(),
            description : joi.string().min(100).required(),
            quantity : joi.number().required(),
            size : joi.number().required(),
            color : joi.string().min(3).max(20).required(),
            createdBy : joi.string().required(),
        });
        return schema.validate(data);
    }
};