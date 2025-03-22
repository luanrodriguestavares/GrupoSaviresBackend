const express = require('express');
const { uploadPhoto, getProjectPhotos, getPhotoById, deletePhoto, updatePhotoMetadata, uploadSinglePhoto, optimizeExistingPhoto } = require('../controllers/photoController');
const { authenticate, isEngineer, isAnyUser } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Rota para upload de uma única foto
router.post('/projects/:projectId/photo', 
    authenticate, 
    isAnyUser, 
    ...upload.single('photo'), 
    uploadSinglePhoto
);

// Rota para upload de fotos
router.post('/projects/:projectId/photos', 
    authenticate, 
    isAnyUser, 
    ...upload.single('photo'), 
    uploadPhoto
);

// Rota para upload múltiplo de fotos
router.post('/projects/:projectId/photos/batch', 
    authenticate, 
    isAnyUser, 
    ...upload.array('photos', 10),
    async (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ message: 'Nenhuma imagem enviada' });
            }

            const uploadPromises = req.files.map(file => {
                const reqCopy = {
                    ...req,
                    file: file,
                    params: req.params
                };
                
                const resCopy = {
                    status: function(code) {
                        this.statusCode = code;
                        return this;
                    },
                    json: function(data) {
                        this.data = data;
                        return this;
                    }
                };
                
                return uploadPhoto(reqCopy, resCopy)
                    .then(() => {
                        if (resCopy.statusCode === 201) {
                            return resCopy.data.photo;
                        }
                        throw new Error(resCopy.data.message);
                    });
            });
            
            const results = await Promise.allSettled(uploadPromises);
            
            const successful = results
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value);
                
            const failed = results
                .filter(result => result.status === 'rejected')
                .map(result => result.reason.message);
            
            res.status(207).json({
                message: 'Processamento de uploads concluído',
                successful,
                failed,
                totalSuccess: successful.length,
                totalFailed: failed.length
            });
        } catch (error) {
            console.error('Erro no processamento em lote:', error);
            res.status(500).json({ message: 'Erro no servidor', error: error.message });
        }
    }
);

// Rota para otimizar uma foto já existente
router.post('/photos/:photoId/optimize', 
    authenticate, 
    isEngineer, 
    optimizeExistingPhoto
);

// Rota para listar todas as fotos de um projeto
router.get('/projects/:projectId/photos', 
    authenticate, 
    isAnyUser, 
    getProjectPhotos
);

// Rota para obter detalhes de uma foto específica
router.get('/photos/:photoId', 
    authenticate, 
    isAnyUser, 
    getPhotoById
);

// Rota para excluir uma foto
router.delete('/photos/:photoId', 
    authenticate, 
    isEngineer, 
    deletePhoto
);

// Rota para atualizar metadados de uma foto
router.put('/photos/:photoId', 
    authenticate, 
    isEngineer, 
    updatePhotoMetadata
);

module.exports = router;