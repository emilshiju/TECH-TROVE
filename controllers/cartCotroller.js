import expressAsyncHandler from "express-async-handler";
import Product from "../models/product.js";
import Cart from "../models/cart.js";
import User from "../models/user.js";
import cart from "../models/cart.js";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import WishList from "../models/wishList.js";
export default {
  addToCart: async (req, res, next) => {
    try {
      console.log(
        "fpsjfosdjiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii"
      );

      const userId = req.user.userId;
      console.log(userId);
      const productId = req.params.id;
      console.log(productId);
      let userCart = await Cart.findOne({ userId });

      const product = await Product.findById(productId);
      if (productId) {
        //checking if the user stock

        if (product.stock <= 0) {
          return res
            .status(200)
            .json({ message: "out of stock", success: false });
        }

        //     if(userCart){
        //     if(userCart.cartItems.quantity>product.stock){
        //         return res.status(200).json({message:"out of stock",success:false})
        //     }

        //  }
      }

      if (!userCart) {
        // Check if the user's cart already exists, if not, create a new cart
        userCart = new Cart({ userId });
      }

      const existingCartItem = userCart.cartItems.find(
        (item) => item.product.toString() === productId // Check if the product already exists in the cartItems array
      );
      console.log("dshfsdifhosidjfsodifjsdifjsdjfldskfjlsdfjdsiofjiodsjf");
      // console.log(existingCartItem.quantity)
      if (existingCartItem) {
        if (existingCartItem.quantity >= product.stock) {
          return res
            .status(200)
            .json({ message: "out of stock", success: false });
        }
      }

      if (existingCartItem) {
        existingCartItem.quantity += 1; // If the product exists, update its quantity
      } else {
        const cartItem = { product: productId, quantity: 1 }; // If the product doesn't exist, add it to the cartItems array
        userCart.cartItems.push(cartItem);
      }

      await userCart.save();
      return res
        .status(200)
        .json({ message: "item added succesfully", success: true });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  getCart: async (req, res, next) => {
    try {
      // for cart lenght
      let cartlengths;
      let wishlistcount = 0;
      const UId = req.user.userId;
      const userId = req.user.userId;
      const carts = await Cart.findOne({ userId: UId });
      if (carts) {
        if (carts.cartItems) {
          cartlengths = carts.cartItems.length;
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

      // const userId=req.user.userId
      console.log(userId);
      const userCart = await Cart.findOne({ userId }).populate(
        "cartItems.product"
      );

      console.log(userCart);
      const user = await User.findById(userId);

      let cartLength = 0;
      if (userCart) {
        cartLength = userCart.cartItems.length;
      } else {
        cartLength = 0;
      }

      if (!userCart) {
        return res.render("user/cart", {
          cartItems: [],
          user,
          cartLength,
          cartlengths,
          wishlistcount,
        });
      }
      const cartItems = userCart.cartItems;

      res.render("user/cart", {
        cartItems,
        user,
        cartLength,
        cartlengths,
        wishlistcount,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  incrementProductQuantity: async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const user = await User.findById(userId);
      const { itemId } = req.body;

      const userCart = await Cart.findOne({ userId: userId }).populate(
        "cartItems.product"
      );

      if (!userCart) {
        console.log("cart not found");
      }

      // find the item in cart
      const item = userCart.cartItems.find(
        (item) => item._id.toString() === itemId
      );

      if (item.quantity >= item.product.stock) {
        return res
          .status(200)
          .json({ status: true, message: "maximun quantity" });
      }
      if (item) {
        item.quantity += 1;

        let individualTotal = item.quantity * item.product.price;

        let totalPrice = 0;

        userCart.cartItems.forEach((cartItem) => {
          const productPrice = cartItem.product.price;
          const quantity = cartItem.quantity;
          const itemTotal = productPrice * quantity;
          totalPrice += itemTotal;
        });
        // save the updated cart document
        const updatedCart = await userCart.save();

        const jsonResponse = {
          success: true,
          message: "item quantity incremented ",
          updatedCart: item.quantity,
          totalPrice: totalPrice,
          individualTotal: individualTotal,
        };
        res.json(jsonResponse);
      } else {
        console.log("item not found");
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  decrementProductQuantity: async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const user = await User.findById(userId);
      const { itemId } = req.body;
      const userCart = await cart
        .findOne({ userId: userId })
        .populate("cartItems.product");

      if (!userCart) {
        console.log("cart not found");
        return;
      }

      const item = userCart.cartItems.find(
        (item) => item._id.toString() === itemId
      );
      if (item) {
        item.quantity -= 1;
        if (item.quantity === -1) {
          item.quantity = 0;
        }

        let individualTotal = item.quantity * item.product.price;

        let totalPrice = 0;
        userCart.cartItems.forEach((cartItem) => {
          const productPrice = cartItem.product.price;
          const quantity = cartItem.quantity;
          const itemTotal = productPrice * quantity;
          totalPrice += itemTotal;
        });

        const updateCart = await userCart.save();

        const jsonResponse = {
          sucess: true,
          message: "item quantity incremented",
          updatedCart: item.quantity,
          totalPrice: totalPrice,
          individualTotal: individualTotal,
        };
        res.json(jsonResponse);
      } else {
        console.log("item not found in cart");
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  deleteProductCart: async (req, res, next) => {
    try {
      console.log("vamu");
      console.log(req.body);

      const cartId = req.body.cartId;
      const productId = req.body.proId;
      const product = await Product.findOne({ _id: productId });

      const user = req.user.userId;
      console.log(user);
      const cartfind = await Cart.findOne({ userId: new ObjectId(user) });

      const productObjectId = new ObjectId(productId);
      console.log(productObjectId);
      const updatedCart = await Cart.updateOne(
        { userId: new ObjectId(user), "cartItems.product": productObjectId },
        { $pull: { cartItems: { product: productObjectId } } }
      );
      console.log(updatedCart);

      return res.json({ status: true });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
};
