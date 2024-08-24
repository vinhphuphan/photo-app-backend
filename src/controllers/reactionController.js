import { PrismaClient } from "@prisma/client";
import { responseData } from "../config/config.js";
import { decodeToken } from "../config/jwt.js";

const prisma = new PrismaClient();

// Get reaction by photo_id and user_id
export const getReaction = async (req, res) => {
    // Extract photo_id from request parameters and convert to integer
    const photo_id = parseInt(req.params.photo_id);
    // Extract token from request headers
    const { token } = req.headers;

    // Validate photo_id
    if (isNaN(photo_id)) {
        return responseData(res, "Invalid photo_id", 400);
    }

    try {
        // Check if token is provided
        if (!token) {
            return responseData(res, "Unauthorized: No token provided", 401);
        }

        let user_id;
        try {
            // Decode token to get user_id
            ({ user_id } = decodeToken(token));
        } catch (e) {
            return responseData(res, "Unauthorized: Invalid token", 401);
        }

        // Fetch reaction for the given photo_id and user_id
        const reaction = await prisma.reactions.findFirst({
            where: { photo_id, user_id }
        });

        // Check if reaction exists
        if (!reaction) {
            return responseData(res, "No reaction found", 404);
        }

        // Respond with the fetched reaction
        return responseData(res, `Fetched reaction by user ${user_id} for photo_id ${photo_id} successfully`, 200, reaction);

    } catch (err) {
        // Log error and respond with a system error
        console.error("Error fetching reaction by photo_id and user_id: ", err);
        return responseData(res, "System Error", 500);
    }
};

// Get reaction count by photo_id
export const getReactionCount = async (req, res) => {
    // Extract photo_id from request parameters and convert to integer
    const photo_id = parseInt(req.params.photo_id);

    // Validate photo_id
    if (isNaN(photo_id)) {
        return responseData(res, "Invalid photo id", 400);
    }

    try {
        // Count reactions for the given photo_id
        const reaction_count = await prisma.reactions.count({
            where: { photo_id }
        });

        // Respond with the reaction count
        return responseData(res, `Fetched reaction count by photo_id ${photo_id} successfully`, 200, reaction_count);

    } catch (err) {
        // Log error and respond with a system error
        console.error("Error fetching reaction count by photo_id : ", err);
        return responseData(res, "System Error", 500);
    }
};

// Get distinct reaction types for a given photo_id
export const getDistinctReactionType = async (req, res) => {
    // Extract photo_id from request parameters and convert to integer
    const photo_id = parseInt(req.params.photo_id);

    // Validate photo_id
    if (isNaN(photo_id)) {
        return responseData(res, "Invalid photo id", 400);
    }

    try {
        // Fetch distinct reaction types for the given photo_id
        const reaction_types = await prisma.reactions.findMany({
            where: { photo_id },
            distinct: ["reactionType"],
            select: {
                reactionType: true,
            }
        });

        // Check if reactions exist
        if (!reaction_types.length) {
            return responseData(res, "This photo hasn't been reacted to", 404);
        }

        // Extract distinct reaction types
        const distinctReactionTypes = reaction_types.map(r => r.reactionType);

        // Respond with the distinct reaction types
        return responseData(res, `Fetched distinct reaction types for photo_id ${photo_id} successfully`, 200, distinctReactionTypes);

    } catch (err) {
        // Log error and respond with a system error
        console.error("Error fetching distinct reaction types by photo_id : ", err);
        return responseData(res, "System Error", 500);
    }
};

// Create a new reaction
export const createReaction = async (req, res) => {
    // Extract photo_id from request parameters and convert to integer
    const photo_id = parseInt(req.params.photo_id);
    // Extract reactionType from request body
    const { reactionType } = req.body;
    // Extract token from request headers
    const { token } = req.headers;

    // Validate photo_id
    if (isNaN(photo_id)) {
        return responseData(res, "Invalid photo_id", 400);
    }

    // Define allowed reaction types
    const allowedReactionTypes = ["goodIdea", "love", "thanks", "wow", "haha"];

    // Validate reactionType
    if (!reactionType || !allowedReactionTypes.includes(reactionType)) {
        return responseData(res, "Invalid reactionType. Allowed values are: 'goodIdea', 'love', 'thanks', 'wow', 'haha'", 400);
    }

    try {
        // Check if token is provided
        if (!token) {
            return responseData(res, "Unauthorized: No token provided", 401);
        }

        let user_id;
        try {
            // Decode token to get user_id
            ({ user_id } = decodeToken(token));
        } catch (e) {
            return responseData(res, "Unauthorized: Invalid token", 401);
        }

        // Check if the user has already reacted to this photo
        const existingReaction = await prisma.reactions.findFirst({
            where: { photo_id, user_id }
        });

        if (existingReaction) {
            return responseData(res, "Reaction already exists", 400);
        }

        // Create a new reaction
        const reaction = await prisma.reactions.create({
            data: { 
                photo_id, 
                user_id, 
                reactionType,
                createdAt: new Date()
            }
        });

        // Respond with the created reaction
        return responseData(res, "Created new reaction successfully", 200, reaction);

    } catch (err) {
        // Log error and respond with a system error
        console.error("Error creating new reaction : ", err);
        return responseData(res, "System Error", 500);
    }
}

// Update reaction
export const updateReaction = async (req, res) => {
    // Extract photo_id from request parameters and convert it to an integer
    const photo_id = parseInt(req.params.photo_id);
    // Extract token from request headers
    const { token } = req.headers;
    // Extract new reaction type from request body
    const reactionType = req.body.reactionType;

    // Validate photo_id
    if (isNaN(photo_id)) {
        return responseData(res, "Invalid photo_id", 400);
    }

    // Define allowed reaction types
    const allowedReactionTypes = ["goodIdea", "love", "thanks", "wow", "haha"];

    // Validate reactionType
    if (!reactionType || !allowedReactionTypes.includes(reactionType)) {
        return responseData(res, "Invalid reactionType. Allowed values are: 'goodIdea', 'love', 'thanks', 'wow', 'haha'", 400);
    }

    try {
        // Check if token is provided
        if (!token) {
            return responseData(res, "Unauthorized: No token provided", 401);
        }

        let user_id;
        try {
            // Decode token to get user_id
            ({ user_id } = decodeToken(token));
        } catch (e) {
            return responseData(res, "Unauthorized: Invalid token", 401);
        }

        // Check if a reaction exists for the given photo_id and user_id
        const existingReaction = await prisma.reactions.findFirst({
            where: { photo_id, user_id }
        });

        // If no reaction is found, respond with an error
        if (!existingReaction) {
            return responseData(res, "Reaction not found", 404);
        }

        // Update the reaction
        const updatedReaction = await prisma.reactions.update({
            where: { 
                id: existingReaction.id 
            },
            data: {
                reactionType
            }
        });

        // Respond with a success message and the updated reaction
        return responseData(res, "Updated reaction successfully", 200, updatedReaction);

    } catch (err) {
        // Log error and respond with a system error
        console.error("Error updating reaction: ", err);
        return responseData(res, "System Error", 500);
    }
}

// Delete reaction
export const deleteReaction = async (req, res) => {
    // Extract photo_id from request parameters and convert to integer
    const photo_id = parseInt(req.params.photo_id);
    // Extract token from request headers
    const { token } = req.headers;

    // Validate photo_id
    if (isNaN(photo_id)) {
        return responseData(res, "Invalid photo_id", 400);
    }

    try {
        // Check if token is provided
        if (!token) {
            return responseData(res, "Unauthorized: No token provided", 401);
        }

        let user_id;
        try {
            // Decode token to get user_id
            ({ user_id } = decodeToken(token));
        } catch (e) {
            return responseData(res, "Unauthorized: Invalid token", 401);
        }

        // Check if a reaction exists for the given photo_id and user_id
        const existingReaction = await prisma.reactions.findFirst({
            where: { photo_id, user_id }
        });

        // If no reaction is found, respond with an error
        if (!existingReaction) {
            return responseData(res, "Reaction not found", 404);
        }

        // Delete the reaction
        await prisma.reactions.delete({
            where: { 
                id: existingReaction.id 
            }
        });

        // Respond with a success message
        return responseData(res, "Deleted reaction successfully", 200);

    } catch (err) {
        // Log error and respond with a system error
        console.error("Error deleting reaction: ", err);
        return responseData(res, "System Error", 500);
    }
}





