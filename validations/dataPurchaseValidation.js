const joi = require("joi");

exports.validatePurchaseData = (data) => {
    const schema = joi.object({
        network: joi.string().required(),
        // type: joi.string().valid("SME", "Corporate Gifting", "Awoof Gifting", "SME2").required(),
        amount: joi.number().positive().required().positive(),
        phoneNumber: joi.string().regex(/^\d{10,15}$/).required(),
        // transactionPin: joi.string().regex(/^\d{4}$/).required()
    });
    return schema.validate(data);
};
