const axios = require('axios');

class CnpjService {
    static async getCompanyByCnpj(cnpj) {
        try {
            const cleanCnpj = cnpj.replace(/\D/g, '');
            
            if (cleanCnpj.length !== 14) {
                throw new Error('CNPJ deve conter 14 dígitos numéricos');
            }
            
            const response = await axios.get(`https://www.receitaws.com.br/v1/cnpj/${cleanCnpj}`);
            
            if (response.data.status === 'ERROR') {
                throw new Error('CNPJ não encontrado');
            }
            
            return response.data;
        } catch (error) {
            if (error.response) {
                throw new Error(`Erro na API ReceitaWS: ${error.response.data.message || 'Erro desconhecido'}`);
            } else if (error.request) {
                throw new Error('Não foi possível conectar ao serviço de CNPJ. Verifique sua conexão.');
            } else {
                throw error;
            }
        }
    }
}

module.exports = CnpjService;