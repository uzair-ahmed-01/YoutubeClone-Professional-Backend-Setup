import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;
        const userId = req.user?._id;

        const existingLike = await Like.findOne({ video: videoId, likedBy: userId });

        if (existingLike) {
            // Unlike: Remove the existing like
            await existingLike.remove();
            res.status(200).json(new ApiResponse(200, {}, "Video like removed successfully"));
        } else {
            // Like: Add a new like
            const newLike = new Like({
                video: mongoose.Types.ObjectId(videoId),
                likedBy: userId,
            });
            await newLike.save();
            res.status(201).json(new ApiResponse(201, newLike, "Video liked successfully"));
        }
    } catch (error) {
        // Handle errors with ApiError
        console.error(error);
        const apiError = new ApiError(500, "Internal Server Error");
        res.status(apiError.statusCode).json(new ApiResponse(apiError.statusCode, {}, apiError.message));
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    try {
        // Similar logic for toggling likes on comments
    } catch (error) {
        // Handle errors with ApiError
        console.error(error);
        const apiError = new ApiError(500, "Internal Server Error");
        res.status(apiError.statusCode).json(new ApiResponse(apiError.statusCode, {}, apiError.message));
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    try {
        // Similar logic for toggling likes on tweets
    } catch (error) {
        // Handle errors with ApiError
        console.error(error);
        const apiError = new ApiError(500, "Internal Server Error");
        res.status(apiError.statusCode).json(new ApiResponse(apiError.statusCode, {}, apiError.message));
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    try {
        // Similar logic for retrieving liked videos
    } catch (error) {
        // Handle errors with ApiError
        console.error(error);
        const apiError = new ApiError(500, "Internal Server Error");
        res.status(apiError.statusCode).json(new ApiResponse(apiError.statusCode, {}, apiError.message));
    }
});

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
};
