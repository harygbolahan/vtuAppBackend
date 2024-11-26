const Electric = require('./electricDiscoModel');

const electricDiscoService = require('./electricDiscoService');

//Fetch all electric disco

const fetchAllElectricDisco = async (req, res) => {
    try {
        const electricDisco = await electricDiscoService.getAndSaveElectricDisco();
        console.log('Electric', electricDisco);
        
        res.status(200).json(electricDisco);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

const getAllElectricDisco = async (req, res) => {
    try {
        const electricDisco = await Electric.find();
        console.log('Electric', electricDisco);

        res.status(200).json({
            message: 'All electric disco',
            data: electricDisco
        });
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

const validateElectricMeter = async (req, res) => {
    try {
        console.log('Request body:', req.body); // Log the request body to verify input

        const { meterNumber, productId, type } = req.body.payload;
        console.log('Extracted parameters:', { meterNumber, productId, type }); // Log extracted parameters

        // Correctly pass the parameters as an object
        const electricDisco = await electricDiscoService.validateElectricMeter({
            productId,
            meterNumber,
            type,
        });

        if (!electricDisco) {
            return res.status(404).json({
                message: 'Meter not found',
            });
        }

        res.status(200).json({
            message: 'Meter found',
            data: electricDisco,
        });
    } catch (error) {
        console.error('Controller error:', error);
        res.status(500).json({ error: error.message }); 
    }
};





module.exports = {
    fetchAllElectricDisco,
    getAllElectricDisco,
    validateElectricMeter
}
