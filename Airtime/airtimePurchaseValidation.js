const joi = require('joi');

exports.airtimePurchaseValidation = (data) => {
    const schema = joi.object({
        network: joi.string().required().valid('MTN', 'GLO', 'AIRTEL', '9MOBILE'),
        type: joi.string().required().valid('VTU', 'AWOOF', 'SHARE&SELL'),
        amount: joi.number().required().positive(),
        phoneNumber: joi.string().required().min(10).max(11).pattern(/^[0-9]+$/),
        // transactionPin: joi.string().regex(/^\d{4}$/).required()
    });

    return schema.validate(data);
}

