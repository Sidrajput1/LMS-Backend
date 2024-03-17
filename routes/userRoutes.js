import { Router } from "express";
import { changePassword, forgotPassword, loginUser, logoutUser, registerUser, resetPassword, updateProfile, userDetails } from "../controllers/user.controller.js";
import { isLoggedIn } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";
const router = Router()

router.post('/register',upload.single("avatar"),registerUser)
router.post('/login',loginUser);
router.post('/logout',logoutUser);
router.get('/me',isLoggedIn,userDetails);
router.post('/reset',forgotPassword);
router.post('/reset/:resetToken',resetPassword);
router.post('/change-password',isLoggedIn,changePassword);
router.put('/update/:id',isLoggedIn,upload.single("avatar"),updateProfile);

export default router;