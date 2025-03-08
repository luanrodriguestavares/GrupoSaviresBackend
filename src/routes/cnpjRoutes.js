const express = require("express");
const { searchCnpj } = require("../controllers/cnpjController");
const { authenticate, isAnyUser } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:cnpj", authenticate, isAnyUser, searchCnpj);

module.exports = router;