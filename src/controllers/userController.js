import { PrismaClient } from '@prisma/client';
import { responseData } from "../config/config.js";
import bcrypt from "bcrypt";
import { createAccessToken, createRefreshToken, decodeToken } from "../config/jwt.js";

const prisma = new PrismaClient();

// Sign up
export const signUp = async (req, res) => {

    const { full_name, email, password, birthdate } = req.body;

    const [year, month, day] = birthdate.split('-');

    try {
        const userExists = await prisma.users.findUnique({ where: { email } });

        if (userExists) {
            return responseData(res, "Email already exists", 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            email,
            hashed_password: hashedPassword,
            full_name,
            birthdate: new Date(`${year}-${month}-${day}`),
        };

        await prisma.users.create({ data: newUser });
        return responseData(res, "Sign up successfully", 201, newUser);
    } catch (err) {
        console.error("Error signing up:", err);
        return responseData(res, "System Error", 500);
    }
};

// Login
export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.users.findUnique({ where: { email } });

        if (!user) {
            return responseData(res, "Incorrect email", 400);
        }

        if (!bcrypt.compareSync(password, user.hashed_password)) {
            return responseData(res, "Incorrect password", 400);
        }

        const token = createAccessToken({
            user_id: user.user_id,
        });

        const userInfo = {
            id: user.user_id,
            email: user.email,
            full_name: user.full_name,
            avatar: user.avatar,
            birthdate: user.birthdate,
            introduce: user.introduce,
            website: user.website,
            user_name: user.user_name
        }

        const refreshToken = createRefreshToken({
            user_id: user.user_id
        });

        // Update refresh token in the database
        await prisma.users.update({
            where: { user_id: user.user_id },
            data: { refresh_token: refreshToken }
        });

        return responseData(res, "Login successfully!", 200, { user: userInfo, token: token });
    } catch (err) {
        console.error("Error logging in:", err);
        return responseData(res, "System Error", 500);
    }
};

// Function for logging in with Google
export const loginWithGoogle = async (req, res) => {
    const { sub, name, picture, email } = req.body.data;

    try {
        let token = "";
        let user = null;

        if (email) {
            // Check if a user with the provided email exists
            user = await prisma.users.findUnique({ where: { email } });
        }

        if (user) {
            // User exists, generate an access token
            token = createAccessToken({ user_id: user.user_id, full_name: user.full_name, avatar: user.avatar });
        } else {
            // Check if a user with the provided Google sub exists
            user = await prisma.users.findUnique({ where: { sub_google_id: sub } });

            if (!user) {
                // No existing user found, create a new user
                const newUser = {
                    full_name: name,
                    email: email || `google_${sub}@noemail.com`, // Use a placeholder if no email provided
                    sub_google_id: sub,
                    hashed_password: "", // No password for Google users
                    avatar: picture
                };

                user = await prisma.users.create({ data: newUser });

                // Generate a refresh token for the newly created user
                const refreshToken = createRefreshToken({ user_id: user.user_id });

                // Update the user record with the refresh token
                await prisma.users.update({
                    where: { user_id: user.user_id },
                    data: { refresh_token: refreshToken }
                });
            }

            // Generate an access token
            token = createAccessToken({ user_id: user.user_id, full_name: user.full_name, avatar: user.avatar });
        }

        // Define userInfo to include in response
        const userInfo = {
            id: user.user_id,
            email: user.email,
            full_name: user.full_name,
            avatar: user.avatar,
            birthdate: user.birthdate,
            introduce: user.introduce,
            website: user.website,
            user_name: user.user_name
        };

        // Return success response with user and token
        return responseData(res, "Login with Google successful!", 200, { user: userInfo, token });
    } catch (error) {
        console.error("Error logging in with Google", error);
        return responseData(res, "Error logging in with Google", 500);
    }
};

// Get users
export const getUsersList = async (req, res) => {
    try {
        const data = await prisma.users.findMany();
        return responseData(res, "Get list of users successfully", 200, data);
    } catch (err) {
        console.error("Error fetching users:", err);
        return responseData(res, "System Error", 500);
    }
};

// Get users by id
export const getUserInfoByToken = async (req, res) => {
    const { token } = req.headers
    const { user_id } = decodeToken(token)
    try {
        const data = await prisma.users.findUnique({ where: { user_id } });
        return responseData(res, "Get user by id successfully", 200, data);
    } catch (err) {
        console.error("Error fetching user by id:", err);
        return responseData(res, "System Error", 500);
    }
};

// Get user info by user_name
export const getUserInfoByUserName = async (req, res) => {
    const user_name = req.params.user_name
    try {
        const user = await prisma.users.findUnique({ where: { user_name } });
        const userInfo = {
            user_id : user.user_id,
            email: user.email || "",
            full_name: user.full_name,
            avatar: user.avatar,
            birthdate: user.birthdate,
            introduce: user.introduce,
            website: user.website,
            user_name: user.user_name
        }

        return responseData(res, "Get user by user_name successfully", 200, userInfo);
    } catch (err) {
        console.error("Error fetching user by user_name:", err);
        return responseData(res, "System Error", 500);
    }
};

// Upload user info by token
export const uploadUserInfo = async (req, res) => {
    const {
        full_name,
        introduce,
        website,
        user_name,
        photo_path
    } = req.body;
    const { token } = req.headers;

    // Check if token is provided in the headers
    if (!token) {
        return responseData(res, "Unauthorized: No token provided", 401);
    }

    let user_id;

    try {
        // Decode the token to extract user_id
        const decoded = decodeToken(token);
        user_id = decoded?.user_id;
    } catch (error) {
        return responseData(res, "Unauthorized: Invalid token", 401);
    }

    try {
        // Find the user in the database using the user_id
        const user = await prisma.users.findUnique({ where: { user_id } });

        if (!user) {
            return responseData(res, "User not found", 404);
        }

        // Construct the update object dynamically based on non-empty fields
        const updateData = {};

        // Add fields to updateData only if they are provided (non-empty)
        if (full_name) updateData.full_name = full_name;
        if (introduce) updateData.introduce = introduce;
        if (website) updateData.website = website;
        if (user_name) updateData.user_name = user_name;
        if (photo_path) updateData.avatar = photo_path;

        // Update user's info in the database only if there are fields to update
        let updatedUser;
        if (Object.keys(updateData).length > 0) {
            updatedUser = await prisma.users.update({
                where: { user_id },
                data: updateData
            });
        }

        const userInfo = {
            id: user.user_id,
            email: user.email,
            full_name: user.full_name,
            avatar: user.avatar,
            birthdate: user.birthdate,
            introduce: user.introduce,
            website: user.website,
            user_name: user.user_name
        }
        return responseData(res, "Upload user info by token successfully", 200, userInfo);
    } catch (err) {
        console.error("Error uploading user info by token: ", err);
        return responseData(res, "System Error", 500);
    }
};

// Get the follwers of user by user_name
export const getFollowersByUserName = async (req, res) => {
    const user_name = req.params.user_name;
    try {
        const user = await prisma.users.findUnique({ where: { user_name } });
        if (!user) {
            return responseData(res, "User not found", 404);
        }
        const followers = await prisma.followers.findMany(
            {
                where: { followed_id: user.user_id },
                include: { usersFollowing: true }
            },
        )

        const formattedFollowers = followers.map(follower => ({
            user_id: follower.usersFollowing.user_id,
            full_name: follower.usersFollowing.full_name,
            avatar: follower.usersFollowing.avatar,
            user_name: follower.usersFollowing.user_name,
          }));

        return responseData(res, "Get followers by user_name successfully", 200, formattedFollowers);
    } catch (err) {
        console.error("Error followers user by user_name:", err);
        return responseData(res, "System Error", 500);
    }
};