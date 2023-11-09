import os from "os";
import app from "./app.js"
import MongoDB from "./config/db.js"
import dotenv from 'dotenv';

dotenv.config();


MongoDB()
app.listen(5000,()=>{
    console.log("Server Started on http://localhost:5000")
})