const axios = require('axios');

class CepService {
    static async getAddressByCep(cep) {
        try {
            const cleanCep = cep.replace(/\D/g, '');
            
            if (cleanCep.length !== 8) {
                throw new Error('CEP deve conter 8 dígitos numéricos');
            }
            
            const response = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`);
            
            if (response.data.erro) {
                throw new Error('CEP não encontrado');
            }
            
            return response.data;
        } catch (error) {
            if (error.response) {
                throw new Error(`Erro na API ViaCEP: ${error.response.data.message || 'Erro desconhecido'}`);
            } else if (error.request) {
                throw new Error('Não foi possível conectar ao serviço de CEP. Verifique sua conexão.');
            } else {
                throw error;
            }
        }
    }
}

module.exports = CepService;