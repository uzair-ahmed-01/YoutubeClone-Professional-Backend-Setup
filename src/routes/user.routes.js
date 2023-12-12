import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middelware.js"

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
    registerUser)

export default router