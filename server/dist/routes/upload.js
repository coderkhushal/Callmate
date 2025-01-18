"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const router = express.Router();
router.post("/", (req, res) => {
    console.log(req.body);
    res.send("Received");
});
module.exports = router;
