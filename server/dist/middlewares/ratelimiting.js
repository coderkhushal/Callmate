"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ratelimiting = void 0;
const store = {};
const ratelimiting = (req, res, next) => {
    const ip = req.ip;
    const time = Date.now();
    const rate = 2000;
    const limit = 1;
    console.log(store[ip]);
    if (store[ip]) {
        if (store[ip].length >= limit) {
            if (time - store[ip][0] < rate) {
                console.log("too many requests");
                return res.status(429).json({ error: "Too many requests" });
            }
            else {
                store[ip].shift();
                store[ip].push(time);
            }
        }
        else {
            store[ip].push(time);
        }
    }
    else {
        store[ip] = [time];
    }
    next();
};
exports.ratelimiting = ratelimiting;
