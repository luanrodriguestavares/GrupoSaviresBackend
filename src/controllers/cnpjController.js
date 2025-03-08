const CnpjService = require('../services/cnpjService');

exports.searchCnpj = async (req, res) => {
    try {
        const { cnpj } = req.params;
        
        const companyData = await CnpjService.getCompanyByCnpj(cnpj);
        
        res.json(companyData);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};