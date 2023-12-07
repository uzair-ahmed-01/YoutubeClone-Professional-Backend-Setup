// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";
dotenv.config({
    path: './.env'
})

import express from "express"
const app = express()

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})






/* 
import 'dotenv/config'
import mongoose from "mongoose"
import { DB_NAME } from './constants.js'


import express from "express"
const app = express()

app.get('/', (req, res) => {
    try {
        // Your route logic here
        res.send('Hello, World!');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

(async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST : ${connectionInstance.connection.host}`)
        app.on("errror", (error) => {
            console.log("ERRR: ", error)
            throw error
        })

        app.listen(`${process.env.PORT}`, () => {
            console.log(`App is listening on port ${process.env.PORT}`)
        })
    } catch (error) {
        console.error("ERROR ", error)
        throw error
    }
})();
*/