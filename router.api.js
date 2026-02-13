import express from 'express';
import User from './models/users.js';

const apiRouter = express.Router();

apiRouter.get("/check", async (req, res, next) => {
    try {
        const { username, shoulddelete } = req.query;

        if (username) {
            const exists = await User.findOne({ username });

            if (exists) {
                return res.status(200).json({ available: false, message: "Username already taken" });
            } else {
                return res.status(200).json({ available: true, message: "Username is available" });
            }
        } else if (shoulddelete) {
            const validUsername = req.user.username.trim();

            if (validUsername == shoulddelete) {
                return res.status(200).json({ valid: true, message: "correct username" });
            } else {
                return res.status(200).json({ valid: false, message: "incorrect username" });
            }
        }

        return res.status(400).json({ available: false, message: "Please enter a value to check" });
    } catch (err) {
        err.status = 500
        next(err)
    }
});

export default apiRouter;