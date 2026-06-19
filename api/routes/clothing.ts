import { Router } from 'express';
import * as clothingController from '../controllers/clothing';

const router = Router();

router.post('/', clothingController.createClothing);
router.get('/', clothingController.getClothingList);
router.get('/overdue', clothingController.getOverdueClothing);
router.get('/type-configs', clothingController.getTypeConfigs);
router.get('/barcode/:barcode', clothingController.getClothingByBarcode);
router.put('/:id/status', clothingController.updateClothingStatus);
router.put('/:id/pickup', clothingController.pickupClothing);
router.get('/customer/:phone', clothingController.getCustomerHistory);

export default router;
