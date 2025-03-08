const express = require("express");
const { searchCep } = require("../controllers/cepController");
const { authenticate, isAnyUser } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:cep", authenticate, isAnyUser, searchCep);

module.exports = router;