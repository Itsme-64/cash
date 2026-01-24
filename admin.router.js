import express from 'express';
import { } from './middleware/admin-router-helpers.js';
import { checkAuthenticated, requireAdmin } from './middleware/auth.js';

const adminRouter = express.Router();

adminRouter.use(checkAuthenticated);
adminRouter.use(requireAdmin);

adminRouter.get('/', (req, res) => {
    res.render('admin/admin')
});

export default adminRouter;