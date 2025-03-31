const express = require("express");
const { updateUser, searchUsers, toggleUserStatus, getCurrentUser, updateProfilePicture } = require("../controllers/userController");
const { authenticate, isEngineer, isAnyUser } = require("../middleware/authMiddleware");
const profileUpload = require("../middleware/profileUploadMiddleware");
const router = express.Router();

router.get("/me", authenticate, isAnyUser, getCurrentUser);
router.put("/:userId", authenticate, updateUser);
router.get("/search", authenticate, isAnyUser, searchUsers);
router.put("/:userId/status", authenticate, isEngineer, toggleUserStatus);
router.put("/:userId/profile-picture", authenticate, isAnyUser, ...profileUpload.single('image'), updateProfilePicture);

module.exports = router;