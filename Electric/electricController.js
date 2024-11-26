const Electric = require('./electricModel');
const walletService = require('../services/walletServices');
const electricService = require('./electricService');



const purchaseElectricToken = async (req, res) => {
    try {
        const userId = req.user._id;
        const { meterNumber, productId, type, amount, pin } = req.body.payload;

        if (!meterNumber || !productId || !type || !amount) {
            return res.status(400).json({
                message: 'All fields are required',
            });
        }

        const wallet = await walletService.getUserWallet(userId);

        if (!wallet) {
            return res.status(404).json({ message: "Wallet not found" });
        }

        if (wallet.walletBalance < amount) {
            return res.status(400).json({ message: "Insufficient balance" });
        }

        // Create the initial transaction entry
        const electricTransaction = await Electric.create({
            userID: userId,
            discoType: type,
            amount,
            meterNumber,
            status: 'initialised',
        });

        const electricPayload = {
            meterNumber,
            productId,
            type,
            amount,
            pin,
        };

        // Call the service to purchase the electric token
        const response = await electricService.purchaseElectricToken(electricPayload);

        console.log('Controller response', response);

        // Check if the transaction was completed
        if (response.status === 'completed') {
            // Deduct the amount from the user's wallet since the transaction was successful
            await walletService.deductAmount(userId, amount);

            // Update the transaction with the response details
            electricTransaction.status = 'success';
            electricTransaction.details = response.details;
            electricTransaction.token = response.meter_token;
            electricTransaction.units = response.meter_units;
            electricTransaction.previousBalance = response.balance_before;
            electricTransaction.currentBalance = response.balance_after;
            electricTransaction.externalTransactionId = response.reference;
            electricTransaction.discount = response.discount;

            // Save the updated transaction
            await electricTransaction.save();

            // Return success response to the frontend
            return res.status(200).json({
                message: "Electric token purchased successfully",
                data: {
                    id: electricTransaction.transactionId,
                    type: response.type,
                    details: electricTransaction.details,
                    token: electricTransaction.token,
                    units: electricTransaction.units,
                    amount: electricTransaction.amount,
                    previousBalance: electricTransaction.previousBalance,
                    currentBalance: electricTransaction.currentBalance,
                    status: electricTransaction.status,
                }
            });
        } else {
            // If the purchase was not successful, update the status to failed
            electricTransaction.status = 'failed';
            await electricTransaction.save();

            // Refund the user since the transaction failed
            try {
                await walletService.refundAmount(userId, amount);
                
            } catch (error) {
                throw new Error('Refund can not be processed at this time', error);
            }

            // Throw an error to be caught by the catch block
            throw new Error('Electric token purchase failed');
        }
    } catch (error) {
        console.error('Controller error:', error);

        // General error response
        res.status(500).json({ error: error.message });
    }
};






module.exports = {
    purchaseElectricToken
}
