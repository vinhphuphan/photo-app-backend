import { PrismaClient } from '@prisma/client';
import { responseData } from "../config/config.js";
import { decodeToken } from '../config/jwt.js';

const prisma = new PrismaClient();

// Get photos with pagination
export const getPhotos = async (req, res) => {
    
    try {
        const data = await prisma.photos.findMany({
            include: {
                users: true
            }
        });

        return responseData(res, "Get photos successfully", 200, data);
    } catch (err) {
        console.error("Error fetching photos:", err);
        return responseData(res, "System Error", 500);
    }
};


// Search photos
export const searchPhotos = async (req, res) => {

    let query = req.params.query;

    try {
        const data = await prisma.photos.findMany(
            {
                where: {
                    title: {
                        contains: query
                    }
                }
            }
        );
        if (data) {
            return responseData(res, "Get photos successfully", 200, data);
        }
        return responseData(res, `No exact match for query : ${query}`, 200, "");
    } catch (err) {
        console.error("Error search photos: ", err);
        return responseData(res, "System Error", 500);
    }
};

// Get photo details and user that created the photo by photo_id
export const getPhotoById = async (req, res) => {
    const photo_id = parseInt(req.params.id); // Destructure photo_id from req.params

    try {
        const data = await prisma.photos.findUnique({
            where: { photo_id },
            include: {
                users: true
            }
        });

        if (!data) {
            return responseData(res, `Photo with id ${photo_id} not found`, 404);
        }

        return responseData(res, `Get photo by id ${photo_id} successfully`, 200, data);
    } catch (err) {
        console.error("Error getting photo by id:", err);
        return responseData(res, "System Error", 500);
    }
};

// Check save or not by photo_id and user_id from token in header to toggle the heart button on the right corner of photo 
export const checkSave = async (req, res) => {
    // Extract photo_id from request body
    const photo_id = parseInt(req.params.id);

    // Extract token from request headers
    const { token } = req.headers;

    // Decode token to extract user_id
    const { user_id } = decodeToken(token);

    try {

        // Check if the photo with the given photo_id exists
        const photo = await prisma.photos.findFirst({
            where: { photo_id }
        });

        if (!photo) {
            return responseData(res, "Photo not found", 404);
        }

        // Check if the user has saved the photo
        const savedPhoto = await prisma.saved_photos.findFirst({
            where: {
                user_id: parseInt(user_id), // Convert user_id to integer for comparison
                photo_id: parseInt(photo_id) // Convert photo_id to integer for comparison
            }
        });

        // Return response indicating whether the photo is saved by the user
        return responseData(res, "Check save status successfully", 200, !!savedPhoto);
    } catch (err) {
        console.error("Error checking save status:", err);
        return responseData(res, "System Error", 500);
    }
};

export const savePhoto = async (req, res) => {
    // Extract photo_id from request body
    const photo_id = parseInt(req.body.photo_id);

    // Extract token from request headers
    const { token } = req.headers;

    try {
        // Decode token to extract user_id
        const { user_id } = decodeToken(token);

        // Check if the user with the given user_id exists
        const user = await prisma.users.findUnique({
            where: { user_id }
        });

        if (!user) {
            return responseData(res, "User does not exist", 404);
        }

        // Check if the photo with the given photo_id exists
        const photo = await prisma.photos.findUnique({
            where: { photo_id }
        });

        if (!photo) {
            return responseData(res, "Photo not found", 404);
        }

        const savedStatus = await prisma.saved_photos.findFirst({
            where: {
                user_id: user_id,
                photo_id: photo_id,
            }
        });

        if (savedStatus) {
            return responseData(res, "Already saved", 404);
        }

        let newSaved = {
            user_id,
            photo_id,
            save_date: new Date(),
        }

        // Check if the user has saved the photo
        const createSaved = await prisma.saved_photos.create({ data: newSaved });

        // Return response indicating whether the photo is saved by the user
        return responseData(res, `User id ${user_id} have saved photo id ${photo_id} successfully`, 201, createSaved);
    } catch (err) {
        console.error("Error saving photo:", err);
        return responseData(res, "System Error", 500);
    }
}

export const uploadPhoto = async (req, res) => {
    const { title, photo_description, photo_path } = req.body;
    const { token } = req.headers

    const { user_id } = decodeToken(token)

    try {
        // Check if title and photo_description are provided
        if (!title || !photo_description) {
            return responseData(res, "Title and photo description are required", 400);
        }

        // Check if file exists
        if (!photo_path) {
            return responseData(res, "Photo path is missing", 400);
        }

        const savedPhoto = await prisma.photos.create({
            data: {
                title,
                photo_description,
                photo_path,
                user_id
            }
        });

        return responseData(res, "Upload photo successfully", 200, savedPhoto);
    } catch (error) {
        console.log("Error when uploading the photo:", error);
        return responseData(res, "System Error", 500, " ");
    }
}

// Get photos created by user_name
export const getPhotoCreatedByUser = async (req, res) => {
    const user_name = req.params.user_name;

    if (!user_name) {
        return responseData(res, "Invalid user name", 400);
    }

    try {
        const user = await prisma.users.findFirst({ where: { user_name } });
        if (!user) {
            return responseData(res, "User not found", 404);
        }
        const photos = await prisma.photos.findMany({
            where: { user_id: user.user_id },
        });

        if (photos.length === 0) {
            return responseData(res, `Photos created by ${user_name} not found`, 404);
        }

        return responseData(res, `Get photos created by ${user_name} successfully`, 200, photos);
    } catch (err) {
        console.error("Error getting photos by user name:", err);
        return responseData(res, "System Error", 500);
    }
};

// Get photos saved by user_name
export const getPhotoSavedByUser = async (req, res) => {
    const user_name = req.params.user_name;

    if (!user_name) {
        return responseData(res, "Invalid user name", 400);
    }

    try {
        const user = await prisma.users.findUnique({ where: { user_name } });

        if (!user) {
            return responseData(res, "User not found", 404);
        }

        const savedPhotos = await prisma.saved_photos.findMany({
            where: { user_id: user.user_id },
            include: {
                photos: true
            }
        });

        if (savedPhotos.length === 0) {
            return responseData(res, `Photos saved by user ${user_name} not found`, 404);
        }

        // Extract the photos from the savedPhotos array
        const photos = savedPhotos.map(savedPhoto => savedPhoto.photos);

        return responseData(res, `Get photos saved by user ${user_name} successfully`, 200, photos);
    } catch (err) {
        console.error("Error getting photos saved by user_name:", err);
        return responseData(res, "System Error", 500);
    }
};

// Delete photo by photo_id
export const deletePhoto = async (req, res) => {
    const photo_id = parseInt(req.params.photo_id); // Destructure photo_id from req.params

    try {
        const photo = await prisma.photos.findFirst({
            where: { photo_id }
        });

        if (!photo) {
            return responseData(res, `Photo with id ${photo_id} not found`, 404);
        }

        await prisma.photos.delete({ where: { photo_id } })

        return responseData(res, `Delete photo id ${photo_id} successfully`, 200, photo);
    } catch (err) {
        console.error("Error deletting photo by id:", err);
        return responseData(res, "System Error", 500);
    }
};