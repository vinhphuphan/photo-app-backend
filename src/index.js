import express from "express";
import cors from "cors";
import rootRouter from "./routes/rootRouter.js";
import { config } from "dotenv";

// Load environment variables
config();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(cors(
    
));
app.use(rootRouter);

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
