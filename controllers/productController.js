import asyncHandler from "express-async-handler";
import product from "../models/product.js";
import category from "../models/category.js";
import Product from "../models/product.js";
import Cart from "../models/cart.js";
import WishList from "../models/wishList.js";
import { ObjectId } from "mongodb";
import { find, race } from "async";
import Oder from "../models/oder.js";

export default {
  getAddProducts: asyncHandler(async (req, res, next) => {
    try {
      const Category = await category.find({ is_listed: { $ne: true } });

      var errorMessage;

      if (req.query.value) {
        errorMessage = req.flash("message");
      }

      const flashmessage = req.flash("message");

      console.log(flashmessage);
      res.render("admin/add-Products", {
        flash: flashmessage,
        message: errorMessage,
        Category,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }),
  addProducts: asyncHandler(async (req, res, next) => {
    try {
      const replaceSpace = req.body.name.replace(/\s+/g, "");
      console.log(replaceSpace);
      const productLowercase = replaceSpace.toLowerCase();
      console.log(productLowercase);
      const existingProduct = await product.findOne({
        name: { $regex: new RegExp(`${productLowercase}`, "i") },
      });

      if (existingProduct) {
        console.log(existingProduct);
        req.flash("message", "same prodcut exists");
        return res.redirect("/add-Products?value=false");
      }
      console.log(existingProduct);
      console.log("sucess");
      const images = req.files.map((file) => file.filename);
      console.log(images);
      console.log(req.body);
      const products = new product({
        name: req.body.name,
        description: req.body.description,
        images: images,
        memory: req.body.memory,
        storage: req.body.storage,
        os: req.body.os,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        stock: req.body.stock,
      });
      await products.save();
      console.log("succss");
      req.flash("message", "you succesfuly created");
      res.redirect("/add-Products");
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  showProducts: asyncHandler(async (req, res, next) => {
    try {
      const products = await product.find({});
      const flashMessage = req.flash("message");
      res.render("admin/list-Products", {
        flash: flashMessage,
        products,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  getEditProductForm: asyncHandler(async (req, res, next) => {
    try {
      const id = req.params.id;
      const Category = await category.find({});
      const Product = await product.findById({ _id: id });
      const find = await category.findById(Product.category);
      //    console.log(Product._id)
      //    console.log(find.title)
      //   const fil=find.title

      const filter = Category.filter((a) => {
        console.log("am title", a.title !== find.title);
        return a.title !== find.title;
      });
      console.log(Product);
      res.render("admin/edit-Product", { Product, filter, find });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  editProduct: asyncHandler(async (req, res, next) => {
    try {
      console.log(req.body.status);
      let productData = await product.findById(req.body.id);

      const images = req.files.map((file) => file.filename);

      const updatedImage = images.length > 0 ? images : productData.images;

      console.log(updatedImage);
      const Product = await product.findByIdAndUpdate(req.body.id, {
        name: req.body.name,
        description: req.body.description,
        images: updatedImage,
        memory: req.body.memory,
        storage: req.body.storage,
        os: req.body.os,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        stock: req.body.stock,
        status: req.body.status,
      });

      req.flash("message", "succesfully edited");
      res.redirect("/show-Products");
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  blockUnblockProduct: asyncHandler(async (req, res, next) => {
    try {
      console.log("vanu");
      const productId = req.params.productId;
      const PRODUCT = await product.findByIdAndUpdate({ _id: productId });
      if (PRODUCT.status) {
        await product.findByIdAndUpdate(
          { _id: productId },
          { $set: { status: false } }
        );
        res.status(200).json({ status: true });
      } else {
        await product.findByIdAndUpdate(
          { _id: productId },
          { $set: { status: true } }
        );
        res.status(200).json({ status: false });
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  singleProduct: asyncHandler(async (req, res, next) => {
    try {
      // for cart lenght
      let id = req.query.id;
      let cartlengths;
      let wishlistcount = 0;

      if (req.user) {
      }

      let notUser;
      let users;
      let allUsers;
      if (req.user) {
        users = await product.findOne({
          _id: id,
          "rating.user": req.user.userId,
        });
        if (users && users.rating) {
          users = users.rating.filter((rating) =>
            rating.user.equals(req.user.userId)
          );
        }
        notUser = await product.findOne({
          _id: id,
          "rating.user": req.user.userId,
        });

        if (notUser && notUser.rating) {
          notUser = notUser.rating.filter(
            (rating) => rating.user.toString() != req.user.userId
          );
        }
      }
      if (!req.user) {
        allUsers = await product.findOne({ _id: id });
      }

      //      getting starts count

      let starsCount = [0, 0, 0, 0, 0];
      let findReview = await product.findOne({ _id: id });

      if (findReview) {
        for (let review of findReview.rating) {
          let rating = review.ratingValue;

          if (rating >= 1 && rating <= 5) {
            starsCount[rating - 1]++;
          }
        }
      }

      let totalReview = starsCount.reduce((total, count) => total + count, 0);

      let cappedOverallRating = 0; // Initialize to a default value
      if (totalReview > 0) {
        let starPercentages = starsCount.map(
          (count) => (count / totalReview) * 100
        );
        cappedOverallRating = starPercentages.reduce(
          (total, percentage, index) =>
            total + (index + 1) * (percentage / 100),
          0
        );
      }

      // Ensure cappedOverallRating is between 0 and 5
      cappedOverallRating = Math.min(5, Math.max(0, cappedOverallRating));

      console.log("cappedOverallRating:", cappedOverallRating);

      if (req.user) {
        const userId = req.user.userId;
        const cart = await Cart.findOne({ userId: userId });

        if (cart) {
          if (cart.cartItems) {
            cartlengths = cart.cartItems.length;
          } else {
            cartlengths = 0;
          }
        } else {
          cartlengths = 0;
        }

        let userWishList = await WishList.findOne({ user: userId });

        if (userWishList) {
          wishlistcount = userWishList.wishList.length;
        }
      }

      console.log(req.session);
      console.log(req.user);
      // const userId=req.user.userId

      const Product = await product.findOne({ _id: id }).populate("category");
      var existingCartItem;
      console.log(req.user);

      if (req.user) {
        const userId = req.user.userId;
        const userCart = await Cart.findOne({ userId });
        if (userCart)
          existingCartItem = userCart.cartItems.find(
            // Check if the product already exists in the cartItems array
            (item) => item.product.toString() === id
          );
        else existingCartItem = false;
      } else {
        existingCartItem = false;
      }

      console.log(existingCartItem);
      console.log(Product);
      if (Product.status == false) {
        res.render("user/product", {
          user: req.user,
          Product,
          existingCartItem,
          cartlengths,
          wishlistcount,
          users,
          notUser,
          cappedOverallRating,
          allUsers,
        });
      } else {
        res.json("product is blocked");
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  getProductOffer: asyncHandler(async (req, res, next) => {
    try {
      let product = await Product.find();
      console.log(product);
      res.render("admin/product-Offer", { product });
    } catch (error) {
      next(error);
    }
  }),
  editOffer: asyncHandler(async (req, res, next) => {
    try {
      let proId = req.body.productId;
      let offerValue = req.body.offerValue;
      

      let update = await Product.updateOne(
        { _id: proId },
        { offer: offerValue }
      );

      let findProduct = await Product.findById(proId);

      let realprice;
      if (findProduct.realprice == 0) {
        realprice = findProduct.price;
      } else {
        realprice = findProduct.realprice;
      }

      let reducedAmount =
        findProduct.price - findProduct.price * (offerValue / 100);

      await Product.updateOne(
        { _id: findProduct._id },
        { $set: { price: reducedAmount, realprice: realprice } }
      );

      return res.json({ status: true, message: "successfuly updated" });
    } catch (error) {
      next(error);
    }
  }),
  removeOffer: asyncHandler(async (req, res, next) => {
    try {
      let proId = req.body.productId;
      let findProduct = await product.findById(proId);
      console.log(findProduct.price);
      console.log(findProduct.offer);

      // let increasedAmount = findProduct.price + (findProduct.price * (findProduct.offer / 100));
      const increasedAmount = findProduct.price / (1 - findProduct.offer / 100);

    
      let removeOffer = await product.updateOne(
        { _id: proId },
        {
          $set: {
            offer: 0,
            price: increasedAmount, // Set the price to the increased amount
          },
        }
      );

      return res.json({ status: true, message: "successfuly updated" });
    } catch (error) {
      next(error);
    }
  }),
  categoryOffer: asyncHandler(async (req, res, next) => {
    try {
      let findCategory = await category.find();
      console.log(findCategory);
      res.render("admin/categoryOffer", { findCategory });
    } catch (error) {
      next(error);
    }
  }),
  editCategoryOffer: asyncHandler(async (req, res, next) => {
    try {
      let categoryId = req.body.categoryId;
      let offerValue = req.body.offerValue;

      let updateCategory = await category.updateOne(
        { _id: categoryId },
        { offer: offerValue }
      );

      let findProducts = await Product.find({
        category: new ObjectId(categoryId),
      });

      for (const prodcut of findProducts) {
        let realprice = prodcut.price;
        let reducedAmount = prodcut.price - prodcut.price * (offerValue / 100);

        await Product.updateOne(
          { _id: prodcut._id },
          { $set: { price: reducedAmount } }
        );
      }

      return res.json({ status: true, message: "successfuly updated" });
    } catch (error) {
      next(error);
    }
  }),
  removeCategoryOffer: asyncHandler(async (req, res, next) => {
    try {
      let categoryId = req.body.categoryId;
  
      let findOffer = await category.findById(categoryId);

      let removeCategory = await category.updateOne(
        { _id: categoryId },
        { offer: 0 }
      );
      let findProducts = await Product.find({
        category: new ObjectId(categoryId),
      });

      for (const prodcut of findProducts) {
        let realprice = prodcut.realprice;
        let increasedAmount = prodcut.price / (1 - findOffer.offer / 100);

        await Product.updateOne(
          { _id: prodcut._id },
          { $set: { price: increasedAmount } }
        );
      }

      return res.json({ status: true, message: "successfuly removed" });
    } catch (error) {
      next(error);
    }
  }),
  getrateProduct: asyncHandler(async (req, res, next) => {
    try {
      let productId = req.params.productId;
      let userId = req.user.userId;
      let display = false;
      let ratings = 0;

      let productData = await product.findOne({ _id: productId });

      for (let check of productData.rating) {
        if (check.user.toString() == userId) {
          ratings = check.ratingValue;
        }
      }

      if (!ratings) {
        ratings = 0;
      }

      let checkProduct = await Oder.findOne({ user: new ObjectId(userId) });

      if (checkProduct) {
        if (checkProduct.oders) {
          let Products;

          for (Products of checkProduct.oders) {
            for (let one of Products.productDetails) {
              // console.log(one.productId.toString())
              if (one.productId.equals(new ObjectId(productId))) {
                display = true;
              }
            }
          }
        }
      }
    


      res.render("user/rateProducts", { display, productId, ratings });
    } catch (error) {
      next(error);
    }
  }),
  rateProduct: asyncHandler(async (req, res, next) => {
    try {
      let userId = req.user.userId;
      let productId = req.body.productId;
      let review = req.body.review;
      let ratingValue = req.body.ratingValue;
      let findProductRate = await product.findOne({
        rating: {
          $elemMatch: { user: userId },
        },
      });
      //    let  findProductRate=await product.findOne({_id:productId,'rating.user':userId})

      if (findProductRate) {
        let updateRate = await product.updateOne(
          { _id: productId, "rating.user": userId },
          {
            $set: {
              "rating.$.ratingValue": ratingValue,
              "rating.$.review": review,
            },
          }
        );
      }

      let newRating = {
        user: userId,
        ratingValue: ratingValue,
        review: review,
      };
      let newRate = await product.updateOne(
        { _id: productId },
        {
          $push: { rating: newRating },
        }
      );
     
      res.json({ status: true, message: "sucessfuly doned" });
    } catch (error) {
      next(error);
    }
  }),
  deleteReview: asyncHandler(async (req, res, next) => {
    try {
      let reviewId = req.body.reviewId;
      let productId = req.body.productId;
      let findProduct = await product.updateOne(
        { _id: productId },
        {
          $pull: { rating: { _id: reviewId } },
        }
      );
      return res.json({ status: true, message: "succesfuly deleted" });
    } catch (error) {
      next(error);
    }
  }),
};
