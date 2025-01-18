import { NextFunction, Request, Response } from "express";
type Store = Record<string, number[]>;
const store: Store = {};
export const ratelimiting = (req: Request, res: Response, next: NextFunction)=>{
    const ip = req.ip!;
    const time = Date.now();
    const rate = 2000;
    const limit = 1;
    
    console.log(store[ip])
    if(store[ip]){
        if(store[ip].length >= limit){
            if(time - store[ip][0] < rate){
                console.log("too many requests")
                return res.status(429).json({error:"Too many requests"});
            }
            else{
                store[ip].shift();
                store[ip].push(time);
            }
        }
        else{
            store[ip].push(time);
        }
    }
    else{
        store[ip] = [time];
    }

    next();
}
