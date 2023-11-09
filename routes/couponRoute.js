import express  from "express"
import adminProtect from "../middlewares/adminAuthentication.js"
import coupon from "../controllers/couponController.js"
import userProtect from "../middlewares/userAuthentication.js"

const router=express.Router()

router.get('/get-add-Coupon',adminProtect.authenticateToken,coupon.getAddCoupon)
router.post('/addCoupon',adminProtect.authenticateToken,coupon.addCoupon)
router.get('/generate-coupon-code',adminProtect.authenticateToken,coupon.generateCouponCode)
router.get('/couponList',adminProtect.authenticateToken,coupon.listCoupon)

router.delete('/remove-Coupon',adminProtect.authenticateToken,coupon.removeCoupon)


router.get('/couponVerify/:id',userProtect.authenticateToken,coupon.verifyCoupon)
router.get('/applyCoupon',userProtect.authenticateToken,coupon.applyCoupon)



router.get('/get-Edit-coupon/:id',userProtect.authenticateToken,coupon.getEditCoupon)
router.post('/editCoupon',userProtect.authenticateToken,coupon.editCoupon)

export default router
