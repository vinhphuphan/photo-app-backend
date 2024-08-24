import jwt from "jsonwebtoken";
import { responseData } from "./config.js";

// Define secret keys for JWT
const secretKey = process.env.JWT_SECRET_KEY || 'defaultSecretKey';
const secretKeyRef = process.env.JWT_REFRESH_SECRET_KEY || 'defaultRefreshSecretKey';

// Token expiration times
const accessTokenExpiration = "5m";
const refreshTokenExpiration = "10d";

// Create access_token
export const createAccessToken = (data) => jwt.sign(data, secretKey, { expiresIn: accessTokenExpiration });

// Create refresh_token
export const createRefreshToken = (data) => jwt.sign(data, secretKeyRef, { expiresIn: refreshTokenExpiration });

// Verify access_token
export const verifyAccessToken = (token) => jwt.verify(token, secretKey);

// Verify refresh_token
export const verifyRefreshToken = (token) => jwt.verify(token, secretKeyRef);

// Decode Token
export const decodeToken = (token) => jwt.decode(token);

// Middleware to verify access_token
export const verifyAccessTokenMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return responseData(res, "Access token is missing", 401, "");
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return responseData(res, "Access token is missing", 401, "");
    }

    try {
        const decodedToken = verifyAccessToken(token);
        req.user = decodedToken; // Attach decoded user information to the request object
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Access token has expired. Please log in again." });
        } else {
            return res.status(401).json({ error: "Invalid access token" });
        }
    }
};

// Function to refresh tokens
export const refreshToken = (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return responseData(res, "Refresh token is missing", 400, "");
    }

    try {
        const decoded = verifyRefreshToken(refreshToken);
        const newAccessToken = createAccessToken({ user_id: decoded.user_id });
        return responseData(res, "Access token refreshed", 200, { accessToken: newAccessToken });
    } catch (error) {
        return responseData(res, "Invalid refresh token", 401, "");
    }
};
