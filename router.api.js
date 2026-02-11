import express from 'express';
import User from './models/users.js';

const apiRouter = express.Router();

apiRouter.get("/api/check", async (req, res, next) => {
    try {
        const { username } = req.query;

        if (username) {
            const exists = await User.findOne({ username });

            if (exists) {
                res.status(200).json({ available: false, message: "Username already taken" });
            } else {
                res.status(200).json({ available: true, message: "Username is available" });
            }
        }

        return res.status(400).json({ available: false, message: "Please enter a value to check" });
    } catch (err) {
        err.status = 500
        next(err)
    }
});

export default apiRouter;