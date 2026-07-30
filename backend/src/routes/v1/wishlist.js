import express from 'express';
import { verifyJWT } from '../../middlewares/verifyJWT.js';
import wishlistService from '../../services/wishlistService.js';
import ApiResponse from '../../utils/ApiResponse.js';

const router = express.Router();

router.use(verifyJWT); // Require login for all wishlist operations

// Toggle property wishlist state
router.post('/toggle', async (req, res, next) => {
  try {
    const { propertyId } = req.body;
    if (!propertyId) {
      return res.status(400).json(ApiResponse.error('Property ID is required'));
    }
    const result = await wishlistService.toggleWishlist(req.user.id, propertyId);
    res.status(200).json(ApiResponse.success(result, result.message));
  } catch (error) {
    next(error);
  }
});

// Get user's wishlist
router.get('/', async (req, res, next) => {
  try {
    const properties = await wishlistService.getWishlist(req.user.id);
    res.status(200).json(ApiResponse.success(properties, 'Wishlist fetched successfully'));
  } catch (error) {
    next(error);
  }
});

// Check if a single property is in user's wishlist
router.get('/check/:propertyId', async (req, res, next) => {
  try {
    const result = await wishlistService.checkIsWishlisted(req.user.id, req.params.propertyId);
    res.status(200).json(ApiResponse.success(result, 'Wishlist status checked'));
  } catch (error) {
    next(error);
  }
});

export default router;
