import { PrismaClient } from "@prisma/client";
import { responseData } from "../config/config.js";
import { decodeToken } from "../config/jwt.js";

const prisma = new PrismaClient();

// Function to follow a user
export const followUser = async (req, res) => {
    // User ID of the person to be followed
    const { followed_id } = req.params; 
    // Token of the user who is following. This is the user using the app
    const { token } = req.headers; 
    try {
        if (!token) {
            return responseData(res, "Unauthorized: No token provided", 401);
        }

        const { user_id } = decodeToken(token);

        // Check if the following relationship already exists
        const existingFollow = await prisma.followers.findUnique({
            where: {
                following_id_followed_id: {
                    following_id: parseInt(user_id),
                    followed_id: parseInt(followed_id)
                }
            }
        });

        if (existingFollow) {
            return responseData(res, "Already following this user", 400);
        }

        // Create a new follow relationship
        const follow = await prisma.followers.create({
            data: {
                following_id: parseInt(user_id),
                followed_id: parseInt(followed_id)
            }
        });

        return responseData(res, "Followed user successfully", 200, follow);
    } catch (err) {
        console.error("Error following user: ", err);
        return responseData(res, "System Error", 500);
    }
};

// Function to unfollow a user
export const unfollowUser = async (req, res) => {
    // User ID of the person to be unfollowed
    const { followed_id } = req.params; 
    // Token of the user who is unfollowing. This is the user using the app
    const { token } = req.headers;

    try {
        if (!token) {
            return responseData(res, "Unauthorized: No token provided", 401);
        }

        const { user_id } = decodeToken(token);

        // Check if the follow relationship exists
        const existingFollow = await prisma.followers.findUnique({
            where: {
                following_id_followed_id: {
                    following_id: parseInt(user_id),
                    followed_id: parseInt(followed_id)
                }
            }
        });

        if (!existingFollow) {
            return responseData(res, "Not following this user", 400);
        }

        // Delete the follow relationship
        await prisma.followers.delete({
            where: {
                following_id_followed_id: {
                    following_id: parseInt(user_id),
                    followed_id: parseInt(followed_id)
                }
            }
        });

        return responseData(res, "Unfollowed user successfully", 200);
    } catch (err) {
        console.error("Error unfollowing user: ", err);
        return responseData(res, "System Error", 500);
    }
};

// Function to get the list of followers for a user
export const getFollowers = async (req, res) => {
    // User ID of the user whose followers are being fetched
    const { user_id } = req.params; 

    try {
        // Fetch followers for the specified user_id
        const followers = await prisma.followers.findMany({
            where: { followed_id: parseInt(user_id) }
        });

        if (followers.length == 0) {
            return responseData(res, "This user has no followers", 200);
        }

        // Extract the following_id values
        const followingIds = followers.map(follow => follow.following_id);

        // Fetch user details for each following_id
        const users = await prisma.users.findMany({
            where: { user_id: { in: followingIds } }
        });

        // Combine followers with user details
        const followersWithDetails = followers.map(follow => {
            const user = users.find(user => user.user_id === follow.following_id);
            return {
                ...follow,
                following_user_info : user || null
            };
        });

        // Return the list of followers with user details
        return responseData(res, `Fetched followers for user_id ${user_id} successfully`, 200, followersWithDetails);
    } catch (err) {
        console.error("Error fetching followers: ", err);
        return responseData(res, "System Error", 500);
    }
};

// Function to check if a specific user follows another user
export const checkFollow = async (req, res) => {
    // User ID of the person to be checked
    const { followed_id } = req.params; 
    // Token of the user who is checking the follow status
    const { token } = req.headers;

    try {
        if (!token) {
            return responseData(res, "Unauthorized: No token provided", 401);
        }

        const { user_id } = decodeToken(token);

        // Check if the follow relationship exists
        const existingFollow = await prisma.followers.findUnique({
            where: {
                following_id_followed_id: {
                    following_id: parseInt(user_id),
                    followed_id: parseInt(followed_id)
                }
            }
        });

        // Return true if the follow relationship exists, false otherwise
        const isFollowing = existingFollow ? true : false;

        return responseData(res, "Follow status checked successfully", 200, !!isFollowing);
    } catch (err) {
        console.error("Error checking follow status: ", err);
        return responseData(res, "System Error", 500);
    }
};

