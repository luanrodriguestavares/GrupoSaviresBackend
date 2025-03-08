const CepService = require('../services/cepService');

exports.searchCep = async (req, res) => {
    try {
        const { cep } = req.params;
        
        const addressData = await CepService.getAddressByCep(cep);
        
        res.json(addressData);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};