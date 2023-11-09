import  express from "express"
import promotion from "../controllers/promotionsController.js"
import adminProtect from "../middlewares/adminAuthentication.js"
import upload from "../utils/multer.js"
const router=express.Router()

router.get('/getBannerForm',adminProtect.authenticateToken,promotion.getBannerForm)
router.post('/addBanner',adminProtect.authenticateToken,upload.single('image'),promotion.addBanner)
router.get('/banner-List',adminProtect.authenticateToken,promotion.getBannerList)


router.get('/get-edit-banner-form/:id',adminProtect.authenticateToken,promotion.geteditBanner)
router.post('/edit-banner',adminProtect.authenticateToken,upload.single('image'),promotion.editBanner)
router.get('/delete-banner/:id',adminProtect.authenticateToken,promotion.deleteBanner)

export default router