import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { jwt } from "jsonwebtoken";
import { access } from "fs";


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefereshToken()
             
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
      
        return { accessToken, refreshToken }
       
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and referesh token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // # Algorithm
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    // get user details from frontend
    const { fullName, email, username, password } = req.body

    // validation - not empty
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // check if user already exists: username, email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email username is already exists")
    }

    // check for images, check for avatar
    const avaratLocalPath = req.files?.avatar[0]?.path
    //const coverImageLocalPath = req.files?.coverImage[0]?.path
    //console.log(req.files)

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    // upload them to cloudinary, avatar & coverImage
    if (!avaratLocalPath) {
        throw new ApiError(400, "Avatar Path is required")
    }

    const avatar = await uploadOnCloudinary(avaratLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    //console.log(avatar)
    //console.log(coverImage)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wronng while registreting the user")
    }

    // return res
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )
})


const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // checking username or email is empty or not
    // find the user
    // password check
    // access and referesh token
    // send cookie

    const { email, username, password } = req.body
    //console.log(email)

    // if (!(username || email)) alternative ways
    if (!username && !email) {
        throw new ApiError(400, "Username or Email is required")
    }

    const user =await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User does nont exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid User Credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const option = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(
            new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User Logged In Successfully"
        )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }
        
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged Out"))
})

const refreshAccessToken  = asyncHandler(async(req,res)=>{

    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }

   try {
     const decodedToken = jwt.verify(incomingRefreshToken,process.env.ACCESS_TOKEN_SECRET)
 
     const user = User.findById(decodedToken?._id)
 
     if(!user){
         throw new ApiError(401,"Invalid refresh token")
     }
 
     if(incomingRefreshToken !== user?.refreshToken){
         throw new ApiError(401,"Refresh Token is expired or used")
     }
 
     const option ={
         httpOnly:true,
         secure:true
     }
 
     const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
 
     res
     .status(200)
     .cookie("accessToken",accessToken,option)
     .cookie("accessToken",newRefreshToken,option)
     .json(
         new ApiResponse(
             200,
             {accessToken,refreshToken:newRefreshToken},
             "Access token refreshed"
         )
     )
   } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token")
   }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
}

