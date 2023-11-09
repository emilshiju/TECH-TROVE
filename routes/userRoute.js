import express from "express"
import userController from "../controllers/userController.js"
import check from "../middlewares/userAuthentication.js";

const router=express.Router()


router.get('/',check.authenticateToken,userController.getHomePage)
// router.get('/shop',check.authenticateToken,userController.getShopPage)
router.get('/register',check.isLoggedIn,userController.getSignupForm)
router.post('/register',check.isLoggedIn,userController.registerUser)
router.get('/login',check.isLoggedIn,userController.getLoginForm)
router.post('/login',check.isLoggedIn,userController.userLogin)
router.get('/logout',userController.getLogout)



router.get('/shop',check.authenticateToken,userController.displayProduct)
router.get('/categoryShop',check.authenticateToken,userController.displayCategory)

// verify otp

router.get('/getverifyOtp',check.isLoggedIn,userController.getOtpForm)
router.get('/resendOtp',check.isLoggedIn,userController.resendOtp)
router.get('/otpLogin',userController.otpLogin)
router.post('/vertifyOtp',userController.verifyOTP)
router.get('/forgotPassword',userController.getForgotPassword)



//user profile

router.get('/user-Profile',check.authenticateToken,userController.userProfile)
router.get('/my-address',check.authenticateToken,userController.getUserAddress)
router.post('/address-submit',check.authenticateToken,userController.userAddress)
router.get('/edit-Address',check.authenticateToken,userController.editAddress)
router.get('/user-account-details',check.authenticateToken,userController.getUserAccountDetails)
router.get('/my-address-delete',check.authenticateToken,userController.myAddresDelete)
router.get('/walletTransaction',check.authenticateToken,userController.walletTransaction)



//change Password

router.get('/change-Password',check.authenticateToken,userController.changePassword)
router.get('/otpChangePassword',check.authenticateToken,userController.changePasswordOtp)
router.post('/verifchanging',check.authenticateToken,userController.verifychanging)
router.post('/reset-details',check.authenticateToken,userController.resetUserDetails)



//        wishlist 

router.post('/add-to-Wishlist',check.authenticateToken,userController.addToWishlist)
router.get('/get-wish-list',check.authenticateToken,userController.getWishList)
router.delete('/remove-product-wishlist',check.authenticateToken,userController.removeProductWishlist)

export default router
