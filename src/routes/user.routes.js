import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
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
router.route("/logout").post(verifyJWT,logoutUser)
router.route("refresh-token").post(refreshAccessToken)


export default router