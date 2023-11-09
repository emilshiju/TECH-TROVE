
import  express  from "express"
import adminController from "../controllers/adminController.js"
import protect from "../middlewares/adminAuthentication.js"


const router=express.Router()

router.get('/admin',protect.isLoggedIn,adminController.getAdminLogin)
router.get('/adminHome',protect.authenticateToken,adminController.getDashboad)
router.post('/admin',adminController.adminLogin)
router.get('/adminlogout',adminController.adminLogout)


router.get('/alluser',protect.authenticateToken,adminController.getAllUser)
router.get('/showuser/:id',protect.authenticateToken,adminController.showUser)

router.post('/block-User/:user',protect.authenticateToken,adminController.blockUser)
router.post('/unblock-User/:user',protect.authenticateToken,adminController.unblockUser)



//    Sales  Report 

router.get('/salesReport',protect.authenticateToken,adminController.getSalesReport)
router.post('/salesReport',protect.authenticateToken,adminController.postSalesReport)


//   dashboad

router.get('/dashboard',protect.authenticateToken,adminController.dashboad)


export default router