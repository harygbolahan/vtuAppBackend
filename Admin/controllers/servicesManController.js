const ServicesManagement = require('../models/servicesManagement');

// Controller to disable or enable all networks
exports.setGeneralStatus = async (req, res) => {
    const { status } = req.body; // expects 'enabled' or 'disabled'

    if (!['enabled', 'disabled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Use "enabled" or "disabled".' });
    }

    try {
        const updated = await ServicesManagement.findOneAndUpdate(
            {},
            { generalStatus: status },
            { new: true, upsert: true } // Create document if none exists
        );
        res.status(200).json({ message: `All networks ${status} successfully.`, data: updated });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while updating general status.' });
    }
};

// Controller to disable or enable a specific network
exports.setNetworkStatus = async (req, res) => {
    const { networkName, status } = req.body; // expects 'networkName' and 'status'

    if (!['enabled', 'disabled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Use "enabled" or "disabled".' });
    }

    try {
        const updated = await ServicesManagement.findOneAndUpdate(
            { 'networks.name': networkName },
            { $set: { 'networks.$.status': status } },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ error: `Network "${networkName}" not found.` });
        }

        res.status(200).json({ message: `Network "${networkName}" ${status} successfully.`, data: updated });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while updating network status.' });
    }
};

// Controller to disable or enable a specific network type
exports.setNetworkTypeStatus = async (req, res) => {
    const { networkName, typeName, status } = req.body; // expects 'networkName', 'typeName', and 'status'

    if (!['enabled', 'disabled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Use "enabled" or "disabled".' });
    }

    try {
        const updated = await ServicesManagement.findOneAndUpdate(
            { 'networks.name': networkName, 'networks.types.typeName': typeName },
            { $set: { 'networks.$[network].types.$[type].status': status } },
            {
                arrayFilters: [
                    { 'network.name': networkName },
                    { 'type.typeName': typeName },
                ],
                new: true,
            }
        );

        if (!updated) {
            return res
                .status(404)
                .json({ error: `Type "${typeName}" in network "${networkName}" not found.` });
        }

        res.status(200).json({
            message: `Type "${typeName}" in network "${networkName}" ${status} successfully.`,
            data: updated,
        });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while updating network type status.' });
    }
};


// async function seedServicesManagement() {
//   try {
//     const existing = await ServicesManagement.findOne();
//     if (existing) {
//       console.log('ServicesManagement is already initialized.');
//       return;
//     }

//     const data = {
//       generalStatus: 'enabled',
//       networks: [
//         {
//           name: 'MTN',
//           status: 'enabled',
//           types: [
//             { typeName: 'SME', status: 'enabled' },
//             { typeName: 'Gifting', status: 'enabled' },
//             { typeName: 'Corporate', status: 'enabled' },
//             { typeName: 'Awoof', status: 'enabled' },
//           ],
//         },
//         {
//           name: 'Glo',
//           status: 'enabled',
//           types: [
//             { typeName: 'CORPORATE', status: 'enabled' },
//             { typeName: 'Gifting', status: 'enabled' },
//             { typeName: 'SME', status: 'enabled' },
//             { typeName: 'Awoof', status: 'enabled' },

//           ],
//         },
//         {
//           name: 'Airtel',
//           status: 'enabled',
//           types: [
//             { typeName: 'CORPORATE', status: 'enabled' },
//             { typeName: 'Gifting', status: 'enabled' },
//             { typeName: 'SME', status: 'enabled' },
//             { typeName: 'Awoof', status: 'enabled' },

//           ],
//         },
//         {
//           name: 'Mobile',
//           status: 'enabled',
//           types: [
//             { typeName: 'CORPORATE', status: 'enabled' },
//             { typeName: 'Gifting', status: 'enabled' },
//             { typeName: 'SME', status: 'enabled' },
//             { typeName: 'Awoof', status: 'enabled' },

//           ],
//         },
//       ],
//     };

//     const newEntry = new ServicesManagement(data);
//     await newEntry.save();

//     console.log('ServicesManagement seeded successfully.');
//   } catch (error) {
//     console.error('Error seeding ServicesManagement:', error);
//   }
// }

// seedServicesManagement();

