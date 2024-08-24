import express from "express"
import { checkFollow, followUser, getFollowers, unfollowUser } from "../controllers/followController.js";

const followRouter = express()

followRouter.get("/:user_id", getFollowers)
followRouter.get("/check_follow/:followed_id", checkFollow)
followRouter.post("/:followed_id", followUser)
followRouter.delete("/:followed_id", unfollowUser)

export default followRouter;