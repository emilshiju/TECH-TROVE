import express from "express";
import productController from "../controllers/productController.js";
import multer from "../utils/multer.js"
import protect from "../middlewares/adminAuthentication.js"
import check from "../middlewares/userAuthentication.js"
const router=express.Router()


//admin routes 

router.get('/add-Products',protect.authenticateToken,productController.getAddProducts)
router.post('/products/add',protect.authenticateToken,multer.array('images',10),productController.addProducts)
router.get('/show-Products',protect.authenticateToken,productController.showProducts)

router.get('/edit-Product/:id',protect.authenticateToken,productController.getEditProductForm)
router.post('/edit-Products',protect.authenticateToken,multer.array('images',10),productController.editProduct)


router.post('/blockUnblockProduct/:productId',protect.authenticateToken,productController.blockUnblockProduct)



//user routes


router.get('/singleProduct',check.authenticateToken,productController.singleProduct)

// product Offer

router.get('/get-product-Offer',protect.authenticateToken,productController.getProductOffer)
router.post('/edit-product-Offer',protect.authenticateToken,productController.editOffer)
router.post('/remove-Product-Offer',protect.authenticateToken,productController.removeOffer)

// category Offer
router.get('/category-Offer',protect.authenticateToken,productController.categoryOffer)
router.post('/edit-category-Offer',protect.authenticateToken,productController.editCategoryOffer)
router.post('/remove-category-Offer',protect.authenticateToken,productController.removeCategoryOffer)


// rate Products

router.get('/get-rate-Product/:productId',check.authenticateToken,productController.getrateProduct)
router.post('/rateProduct',check.authenticateToken,productController.rateProduct)
router.delete('/delete-review',check.authenticateToken,productController.deleteReview)

export default router