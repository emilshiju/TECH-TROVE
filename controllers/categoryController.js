import asyncHandler from "express-async-handler";
import category from "../models/category.js";

export default {
  getCategoryFoam: async (req, res, next) => {
    try {
      res.render("admin/addCategory");
    } catch (error) {
      next(error);
      console.log(error);
    }
  },
  addCategory: asyncHandler(async (req, res, next) => {
    try {
      const { title, description, offer } = req.body;
    

      const existCategoryLowercase = title.toLowerCase();
      const existingCategory = await category.findOne({
        title: { $regex: new RegExp(`${existCategoryLowercase}`, "i") },
      });
      if (existingCategory) {
        return res
          .status(200)
          .json({ message: "All Ready exists", status: false });
      }

      const newCategory = new category({
        title,
        description,
        offer,
      });

      await newCategory.save();
      console.log("succes");
      // return res.status(200).render('admin/addCategory',{message:'your item was created succesfully'})
      return res
        .status(200)
        .json({ message: " created succesfully", status: true });
    } catch (error) {
      next(error);
   
    }
  }),
  getCategoryForm: asyncHandler(async (req, res) => {
    const flashMessage = req.flash("message");
    const categories = await category.find({});
    res.render("admin/list-Category", {
      flash: flashMessage,
      categories,
    });
  }),
  getEditCategory: asyncHandler(async (req, res) => {
  
    const id = req.params.id;
    console.log(id);
    const categories = await category.find({ _id: id });

    console.log(categories);
    res.render("admin/edit-Category", { categories });
  }),
  editCategory: asyncHandler(async (req, res) => {
    console.log(req.params.id);
    console.log(req.body.status);

    const categories = await category.findByIdAndUpdate(req.params.id, {
      title: req.body.title,
      description: req.body.description,
      is_listed: req.body.status,
      offer: req.body.categoryOffer,
    });
    req.flash("message", "successfully updated");
    res.redirect("/list-Category");
  }),
};
