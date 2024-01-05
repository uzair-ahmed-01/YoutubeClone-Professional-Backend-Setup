import { Router } from "express";
import { chnageCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middelware.js"
import { verifyJWT } from "../middlewares/auth.middlerware.js";

const router = Router()

// middelware added more field with request like name: "avatar" & "coverImage" 
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1

        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

// Secured Routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, chnageCurrentPassword)
router.route("/current-user").post(verifyJWT, getCurrentUser)
router.router("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router