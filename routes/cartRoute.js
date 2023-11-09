import express from "express"
import protect from "../middlewares/userAuthentication.js"
import cart from "../controllers/cartCotroller.js"


const router=express.Router()

router.post('/cartadd/:id',protect.authenticateToken,cart.addToCart)
router.get('/getCart',protect.authenticateToken,cart.getCart)



router.post('/productIncremenet',protect.authenticateToken,cart.incrementProductQuantity)
router.post('/productDecrement',protect.authenticateToken,cart.decrementProductQuantity)

router.delete('/delete-product-cart',protect.authenticateToken,cart.deleteProductCart)

export default router