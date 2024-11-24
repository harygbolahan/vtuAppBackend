const joi = require('joi');

const cableValidations = (data) =>{
    const schema = joi.object({
        name: joi.string().required().valid('GOTV', 'DSTV', 'STARTIMES', 'SHOWMAX'),
        plan: joi.string().required(),
        amount: joi.number().required().positive(),
        iucNumber: joi.string().required(),
    })

    return schema.validate(data);
}