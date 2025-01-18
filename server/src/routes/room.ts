import { Request, Response } from "express"
import {uid} from "uid"
import { ratelimiting } from "../middlewares/ratelimiting"
const express= require("express")
const router = express.Router()
// const Room = require("../service/room")

router.get("/newroom", ratelimiting, (req: Request, res: Response) => {
    // write a function using uuid that generate a string of 9 random alphabets
    // send this code as response

    // TODO: create a in socket and join the user in that room 
    
    res.send(uid(9))

    

})

module.exports = router