import express  from "express";
import oderController from "../controllers/oderController.js";
import adminProtect from "../middlewares/adminAuthentication.js"
import protect from "../middlewares/userAuthentication.js"

const router=express.Router()

router.get('/checkout',protect.authenticateToken,oderController.checkout)
router.post('/checkout',protect.authenticateToken,oderController.postCheckout)
// router.get('/address-edit',protect.authenticateToken,oderController.getaddressEdit)
router.post('/addres-edit',protect.authenticateToken,oderController.addressEdit)
router.get('/address-delete',protect.authenticateToken,oderController.deleteAddress)

//profile
router.get('/oderList',protect.authenticateToken,oderController.getOderList)
router.get('/order-Details',protect.authenticateToken,oderController.getOderDetails)



// direct Buy   GUEST USER
router.get('/direct-Buy/:id',protect.authenticateToken,oderController.directBuy)
router.get('/oder-direct-buy',protect.authenticateToken,oderController.oderDirectBuy)
router.post('/direct-buy-product',protect.authenticateToken,oderController.directBuyProduct)
router.post('/directBuy-addres-edit',protect.authenticateToken,oderController.directBuyAddressEdit)
router.get('/directBuy-address-delete',protect.authenticateToken,oderController.directBuyAddresDelete)




router.put('/cancelOrder',protect.authenticateToken,oderController.cancelOder)



//admin route 

router.get('/admin-oder-list',adminProtect.authenticateToken,oderController.adminOderList)

router.put('/admin/oderStatus',adminProtect.authenticateToken,oderController.oderStatusChange)
router.put('/admin/cancelOder',adminProtect.authenticateToken,oderController.adminCancelOder)
router.put('/admin/returnOder',adminProtect.authenticateToken,oderController.returnOder)


router.get('/admin-oder-details',adminProtect.authenticateToken,oderController.adminOderDetails)



// payment intregation

router.post('/verifyPayment',protect.authenticateToken,oderController.verifyPayment)
router.post('/paymentFailed',protect.authenticateToken,oderController.paymentFailed)


//    walletrazarupay
// router.post('/walletrazarupay',protect.authenticateToken,oderController.walletrazarupay)


// download invoice

router.get('/invoice',protect.authenticateToken,oderController.downloadInvoice)

export default router

