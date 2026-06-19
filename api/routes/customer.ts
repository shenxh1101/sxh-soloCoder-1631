import { Router } from 'express';
import * as customerController from '../controllers/customer';

const router = Router();

router.get('/search', customerController.searchCustomers);
router.get('/recent', customerController.getRecentCustomers);
router.get('/:phone', customerController.getCustomerByPhone);
router.get('/:phone/simple', customerController.getCustomerSimple);
router.put('/:phone', customerController.updateCustomer);

export default router;
