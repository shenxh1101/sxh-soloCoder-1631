import { Router } from 'express';
import * as statsController from '../controllers/statistics';

const router = Router();

router.get('/monthly', statsController.getMonthlyStats);

export default router;
