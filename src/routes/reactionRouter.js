import express from "express"
import { createReaction, deleteReaction, getDistinctReactionType, getReaction, getReactionCount, updateReaction } from "../controllers/reactionController.js";

const reactionRouter = express()

reactionRouter.get("/:photo_id" , getReaction)
reactionRouter.get("/count/:photo_id" , getReactionCount)
reactionRouter.get("/types/:photo_id" , getDistinctReactionType)
reactionRouter.post("/:photo_id" , createReaction)
reactionRouter.put("/:photo_id" , updateReaction)
reactionRouter.delete("/:photo_id" , deleteReaction)

export default reactionRouter;