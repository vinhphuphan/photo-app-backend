import { PrismaClient } from "@prisma/client";
import { responseData } from "../config/config.js";
import { decodeToken } from "../config/jwt.js";

const prisma = new PrismaClient();

// Get comments by photo_id
export const getCommentsByPhotoId = async (req, res) => {
    const photo_id = parseInt(req.params.photo_id);

    try {
        const comments = await prisma.comments.findMany(
            { 
                where: { photo_id },
                include : { users : true } 
            });
        return responseData(res, `Fetched comments for photo_id ${photo_id} successfully`, 200, comments);
    } catch (err) {
        console.error("Error fetching comments by photo_id: ", err);
        return responseData(res, "System Error", 500);
    }
};

// Create a new comment
export const createComment = async (req, res) => {
    const { content } = req.body;
    const photo_id = parseInt(req.params.photo_id);
    const { token } = req.headers;

    try {
        if (!token) {
            return responseData(res, "Unauthorized: No token provided", 401);
        }

        const { user_id } = decodeToken(token);

        if (!photo_id || !content) {
            return responseData(res, "Missing required fields: photo_id or content", 400);
        }

        const newComment = {
            user_id,
            photo_id,
            comment_date: new Date(),
            content
        };

        await prisma.comments.create({ data: newComment });

        return responseData(res, "Comment created successfully", 201, newComment);
    } catch (err) {
        console.error("Error creating comment: ", err);
        return responseData(res, "System Error", 500);
    }
};

// Delete a comment by its id
export const deleteComment = async (req, res) => {
    const comment_id = parseInt(req.params.comment_id);
    const { token } = req.headers;

    // Check for token in the headers
    if (!token) {
        return responseData(res, "Unauthorized: No token provided", 401);
    }

    let user_id;
    try {
        // Decode the token to get the user_id
        const decoded = decodeToken(token);
        user_id = decoded.user_id;
    } catch (error) {
        return responseData(res, "Unauthorized: Invalid token", 401);
    }

    try {
        // Retrieve the comment by comment_id
        const comment = await prisma.comments.findFirst({
            where: { comment_id }
        });

        // If no comment is found, return a 404 response
        if (!comment) {
            return responseData(res, `No comment found for comment_id ${comment_id}`, 404);
        }

        // Check if the user is authorized to delete the comment
        if (user_id !== comment.user_id) {
            return responseData(res, "Unauthorized: Only the user who created the comment can delete it", 401);
        }

        // Delete the comment from the database
        await prisma.comments.delete({
            where: { comment_id }
        });

        return responseData(res, `Deleted comment with id ${comment_id}`, 200, comment);
    } catch (err) {
        console.error("Error deleting comment: ", err);
        return responseData(res, "System Error", 500);
    }
};

// Update a comment's content
export const updateComment = async (req, res) => {
    const comment_id = parseInt(req.params.comment_id);
    const { content } = req.body;
    const { token } = req.headers;

    if (!token) {
        return responseData(res, "Unauthorized: No token provided", 401);
    }

    let user_id;
    try {
        const decoded = decodeToken(token);
        user_id = decoded.user_id;
    } catch (error) {
        return responseData(res, "Unauthorized: Invalid token", 401);
    }

    if (!comment_id || !content) {
        return responseData(res, "Missing required fields: comment_id or content", 400);
    }

    try {
        // Find the specific comment
        const comment = await prisma.comments.findFirst({
            where: { comment_id }
        });

        if (!comment) {
            return responseData(res, `No comment found for comment_id ${comment_id}`, 404);
        }

        // Check if the user is authorized to update the comment
        if (user_id !== comment.user_id) {
            return responseData(res, "Unauthorized: Only the user who created the comment can update it", 401);
        }

        // Update the comment's content
        const updatedComment = await prisma.comments.update({
            where: { comment_id },
            data: { content }
        });

        return responseData(res, "Comment updated successfully", 200, updatedComment);
    } catch (err) {
        console.error("Error updating comment: ", err);
        return responseData(res, "System Error", 500);
    }
};

// Create a new comment with a reference to the parent comment
export const createReply = async (req, res) => {
    const parent_comment_id = parseInt(req.params.parent_comment_id);
    const { content } = req.body;
    const photo_id = parseInt(req.body.photo_id)
    const { token } = req.headers;

    if (!token) {
        return responseData(res, "Unauthorized: No token provided", 401);
    }

    let user_id;
    try {
        const decoded = decodeToken(token);
        user_id = decoded.user_id;
    } catch (error) {
        return responseData(res, "Unauthorized: Invalid token", 401);
    }

    if (!content || !photo_id) {
        return responseData(res, "Missing required fields: content or photo_id", 400);
    }

    try {
        // Create a new comment with a reference to the parent comment
        const reply = await prisma.comments.create({
            data: {
                user_id,
                photo_id,
                comment_date: new Date(),
                content,
                parent_comment_id
            }
        });

        return responseData(res, "Reply created successfully", 201, reply);
    } catch (err) {
        console.error("Error creating reply: ", err);
        return responseData(res, "System Error", 500);
    }
};

export const getReplies = async (req, res) => {
    const parent_comment_id = parseInt(req.params.parent_comment_id);

    try {
        const replies = await prisma.comments.findMany({
            where: { parent_comment_id }
        });

        if (!replies.length) {
            return responseData(res, `No replies found for comment_id ${parent_comment_id}`, 200, []);
        }

        return responseData(res, `Fetched replies for comment_id ${parent_comment_id} successfully`, 200, replies);
    } catch (err) {
        console.error("Error fetching replies: ", err);
        return responseData(res, "System Error", 500);
    }
};

