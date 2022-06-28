const joi = require('joi');
module.exports = {
    categoryValidation : data =>{
        const schema = joi.object({
            name : joi.string().min(3).max(30).required(),
            createdBy : joi.string().required()
        });
        return schema.validate(data);
    }
};