import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

const corsOption = {
    origin: process.env.CORS_ORIGIN || ALL,
    credentials: true,
}

app.use(cors(corsOption))
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

// routes import
import userRouter from "./routes/user.routes.js"
import { ALL } from "dns"


// routes declaration and we can say prefix api
app.use("/api/v1/users", userRouter)

// http://localhost:8000/api/v1/users/register

export { app }