import express from "express"
import userRouter from "./userRouter.js";
import photoRouter from "./photoRouter.js";
import commentRouter from "./commentRouter.js";
import followRouter from "./followRouter.js";
import reactionRouter from "./reactionRouter.js";

const rootRouter = express()

rootRouter.use("/users", userRouter)
rootRouter.use("/photos", photoRouter)
rootRouter.use("/comments", commentRouter)
rootRouter.use("/follows", followRouter)
rootRouter.use("/reactions", reactionRouter)

export default rootRouter;