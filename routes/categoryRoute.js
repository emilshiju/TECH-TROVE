import express from "express";
import category from "../controllers/categoryController.js";
import protect from "../middlewares/adminAuthentication.js"
const router=express.Router()



//add cateogary 
router.get('/category',protect.authenticateToken,category.getCategoryFoam)
router.post('/addCategory',protect.authenticateToken,category.addCategory)

router.get('/list-Category',protect.authenticateToken,category.getCategoryForm)
router.get('/edit-Category/:id',protect.authenticateToken,category.getEditCategory)
router.post('/edit-Category/:id',protect.authenticateToken,category.editCategory)


        
export default router