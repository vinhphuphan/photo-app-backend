import express from "express"
import { getFollowersByUserName, getUserInfoByToken, getUserInfoByUserName, getUsersList, login, loginWithGoogle, signUp, uploadUserInfo } from "../controllers/userController.js";

const userRouter = express();

userRouter.get("/", getUsersList);
userRouter.get("/by-token", getUserInfoByToken);
userRouter.get("/by-user-name/:user_name", getUserInfoByUserName);
userRouter.get("/get-followers-by-user-name/:user_name", getFollowersByUserName);
userRouter.post("/signup", signUp);
userRouter.post("/login", login);
userRouter.post("/google", loginWithGoogle);
userRouter.post("/upload-info", uploadUserInfo)

export default userRouter;