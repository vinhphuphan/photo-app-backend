import express from "express"
import { createComment, createReply, deleteComment, getCommentsByPhotoId, updateComment } from "../controllers/commentController.js";

const commentRouter = express()

commentRouter.get("/:photo_id" , getCommentsByPhotoId)
commentRouter.post("/:photo_id", createComment)
commentRouter.delete("/:comment_id", deleteComment)
commentRouter.put("/:comment_id", updateComment)
commentRouter.post("/reply_comment/:parent_comment_id", createReply)

export default commentRouter;