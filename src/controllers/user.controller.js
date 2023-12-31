import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { jwt } from "jsonwebtoken";

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
    // generate access and referesh token
    // send cookie

    const { email, username, password } = req.body
    //console.log(email)

    // if (!(username || email)) alternative ways
    if (!username && !email) {
        throw new ApiError(400, "Username or Email is required")
    }

    const user = await User.findOne({
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
    // we haved user id becouse of auth-middleware "req.user?._id" 
    // find out user by id and set refreshToken field to undefined
    // return res and set cookie to "clearCookie"

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

const refreshAccessToken = asyncHandler(async (req, res) => {
    // Access Token - Short lived, not stored in db
    // Refresh Token - Long lived, stored in db
    // When access token expires, the frontend sends the refresh token to the backend to validate user (login), once again.

    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.ACCESS_TOKEN_SECRET)

        const user = User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used")
        }

        const option = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        res
            .status(200)
            .cookie("accessToken", accessToken, option)
            .cookie("accessToken", newRefreshToken, option)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const chnageCurrentPassword = asyncHandler(async (req, res) => {
    // req.body { oldPassword, newPassword }
    // find user using "req.user?._id" id that already haved and it comes from auth-middleware
    // checking old password in DB and cheking it matching or not
    // if oldPassword and DB password match then save newPassword into DB password field
    // return res

    const { oldPassword, newPassword } = req.body

    const user = await User.findById(user.req?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))

})

const getCurrentUser = asyncHandler(async (req, res) => {
    // in auth-middlerware we already haved user in "req.user" so directly send res

    res.status(200)
        .json(
            new ApiResponse(200, req.user, "Current user fetch successfully")
        )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    // req.body taking fullname and email
    // checking fullname and email
    // perform DB operation findByIdAndUpdate
    // return res

    const { fullName, email } = req.body

    if (!(fullName || email)) {
        throw new ApiError(400, "All fileds are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    // take avatarLocalPath from req.file
    // checking avatarLocalPath
    // upload into cloudinary and return res
    // checking upload
    // perform user operation on DB using mongoose findByIdUpdate 
    // checking user
    // return res

    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar updated successfully")
        )

})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    // take CoverImageLocalPath from req.file
    // checking CoverImageLocalPath
    // upload into cloudinary and return res
    // checking upload
    // perform user operation on DB using mongoose findByIdUpdate 
    // checking user
    // return res

    const CoverImageLocalPath = req.file?.path

    if (!CoverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(CoverImageLocalPath)

    if (!coverImage) {
        throw new ApiError(400, "Error while uploading on cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Cover image updated successfully")
        )

})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    // req.params
    // checking username exist
    // find out subscriber though channel using aggregate pipeline
    // checking channel exist
    // return response

    const { username } = req.params

    if (username) {
        throw new ApiError(400, "Username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscriberTo"
            }
        },
        {
            $addFields: {
                subScribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscriberTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subScribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel fetch successfully")
        )

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    chnageCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
}

