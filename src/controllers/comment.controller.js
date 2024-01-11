import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        populate: { path: "owner", select: "fullName username avatar" } // Populate the owner field in comments
    };

    const comments = await Comment.paginate({ video: videoId }, options);

    return res.status(200).json(
        new ApiResponse(
            200,
            { comments: comments.docs, totalPages: comments.totalPages },
            "Comments fetched successfully"
        )
    );
});

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    if (!videoId || !content) {
        throw new ApiError(400, "Video ID and content are required");
    }

    const newComment = new Comment({
        content,
        video: mongoose.Types.ObjectId(videoId),
        owner: userId,
    });

    const savedComment = await newComment.save();

    return res.status(201).json(
        new ApiResponse(201, savedComment, "Comment added successfully")
    );
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    if (!commentId || !content) {
        throw new ApiError(400, "Comment ID and content are required");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== userId) {
        throw new ApiError(403, "Unauthorized: You don't own this comment");
    }

    comment.content = content;
    const updatedComment = await comment.save();

    return res.status(200).json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user?._id;

    if (!commentId) {
        throw new ApiError(400, "Comment ID is required");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== userId) {
        throw new ApiError(403, "Unauthorized: You don't own this comment");
    }

    await comment.remove();

    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    );
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
};
