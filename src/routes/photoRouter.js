import express from "express"
import { checkSave, deletePhoto, getPhotoById, getPhotoCreatedByUser, getPhotoSavedByUser, getPhotos, savePhoto, searchPhotos, uploadPhoto } from "../controllers/photoController.js";

const photoRouter = express()

photoRouter.get("/", getPhotos);
photoRouter.get("/search/:query", searchPhotos)
photoRouter.get("/by-photo-id/:id", getPhotoById)
photoRouter.get("/created-by-user-name/:user_name", getPhotoCreatedByUser)
photoRouter.get("/saved-by-user-name/:user_name", getPhotoSavedByUser)
photoRouter.get("/check-save/:id", checkSave)
photoRouter.post("/upload", uploadPhoto)
photoRouter.post("/save-photo", savePhoto)
photoRouter.delete("/:photo_id", deletePhoto)

export default photoRouter;