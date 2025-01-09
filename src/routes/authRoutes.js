const express = require('express');
const { login, register } = require('../controllers/authController');
const { authenticate, authorizeEngineer } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);

module.exports = router;

