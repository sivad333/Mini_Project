const joi = require('joi');
module.exports = {
    userValidation : data =>{
        const schema = joi.object({
            name : joi.string().min(3).max(30).required(),
            mobile: joi.number().min(10).required(),
            email : joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
            password : joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
            city : joi.string().min(3).max(30).required(),
            state : joi.string().min(3).max(30).required(),
            pincode : joi.number().min(6).required(),
            Line1 : joi.string().min(10).max(100).required(),
            Line2 : joi.string().min(10).max(100).required(),
        });
        return schema.validate(data);
    }
};