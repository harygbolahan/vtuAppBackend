const { Worker } = require('bullmq');
const walletService = require('../services/walletServices');
const dataService = require('./dataService');
const Transaction = require('../models/generalModel');
const Users = require('../User/userModels');

const redisConfig = {
    url: process.env.REDIS_URL,
    maxRetriesPerRequest: null,
};



const worker = new Worker(
    'dataPurchaseQueue',
    async (job) => {
        const { userId, network, networkType, phoneNumber, plan, amount } = job.data;

        const user = await Users.findById(userId);
        console.log('User', user);


        try {
            console.log(`Processing job ${job.id} for User: ${userId}`);

            // Step 1: Validate wallet balance
            const userWallet = await walletService.getUserWallet(userId);
            if (!userWallet || userWallet.walletBalance < amount) {
                throw new Error('Insufficient wallet balance');
            }

            // Step 2: Deduct wallet balance
            await walletService.deductAmount(userId, amount);

            // Step 3: Call external API
            const apiResponse = await dataService.purchaseDataFromExternalAPI({
                network,
                mobile_number: phoneNumber,
                plan: plan.datahouse.planId,
                Ported_number: true,
            });

            console.log('Worker response', apiResponse);


            if (!apiResponse.data.Status || apiResponse.data.Status.toLowerCase() !== 'successful') {
                // Refund wallet and log failure
                await walletService.refundAmount(userId, amount);
                throw new Error(apiResponse.api_response || 'Unknown error from external API');
            }

            // Step 4: Log transaction as successful
            await Transaction.create({
                userID: userId,
                network,
                user: user,
                type: networkType,
                phoneNumber,
                amount,
                previousBalance: user.walletBalance,
                newBalance: user.walletBalance - amount,
                serviceType: 'Data',
                status: 'success',
                description: ` ${networkType} ₦${amount} Data purchase for ${phoneNumber}`,
                externalTransactionId: apiResponse.id,
                response: apiResponse.api_response,
            });

            // Log the transaction

            console.log('DataTransaction', Transaction);


            console.log(`Job ${job.id} completed successfully.`);
            return apiResponse; // Store full API response as job result
        } catch (error) {
            console.error(`Job ${job.id} failed: ${error.message}`);

            //save transaction as failed

            await Transaction.create({
                userID: userId,
                user: user,
                network,
                type: networkType,
                phoneNumber,
                amount,
                previousBalance: user.walletBalance,
                newBalance: user.walletBalance,
                serviceType: 'Data',
                status: 'failed',
                description: ` ${networkType} ₦${amount} Data purchase for ${phoneNumber}`,
                response: error.message,
            })

            throw error; // Mark job as failed in BullMQ
        }
    },
    { connection: redisConfig }
);


// Add event listeners for better monitoring
worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully.`);
});

worker.on('failed', (job, err) => {
    console.log(`Job ${job.id} failed with error: ${err.message}`);
});

module.exports = worker;
