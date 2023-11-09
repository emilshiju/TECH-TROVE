import asyncHandler from "express-async-handler";
import Address from "../models/address.js";
import Cart from "../models/cart.js";
import Product from "../models/product.js";
import Oder from "../models/oder.js";
import mongoose, { trusted } from "mongoose";
import User from "../models/user.js";
import querystring from "querystring";
import easyinvoice from "easyinvoice";
import crypto from "crypto";
import Razorpay from "razorpay";
import fs from "fs";
import { Readable } from "stream";
import { ObjectId } from "mongodb";
import { debug } from "console";
import { fstat } from "fs";
import WishList from "../models/wishList.js";

// const ObjectId = mongoose.Types.ObjectId;

export default {
  checkout: asyncHandler(async (req, res, next) => {
    try {
      // for cart lenght
      let cartlengths;
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
      let wishlistcount = 0;
      let userWishList = await WishList.findOne({ user: userId });

      if (userWishList) {
        wishlistcount = userWishList.wishList.length;
      }

      var show;
      var addres;
      var add;
      var count;
      var notadd = true;
      var narrowbar = false;

      var edit = false;
      if (req.query.edit) {
        edit = true;
      }
      let num = parseInt(req.query.number) || 0;
      console.log(num);
      console.log(
        "dfkjsdjfosjf888888888888888888888888888888888888888888888888888888888888888888888"
      );

      const flashMessage = req.flash("message");

      const user = new mongoose.Types.ObjectId(userId);
      const findAddress = await Address.findOne({ user: userId });

      if (findAddress) {
        count = findAddress.address.length;
      }

      let ans;
      let length;
      if (findAddress && findAddress.address.length) {
        ans = findAddress.address[num];
        length = findAddress.address.length;
      }

      if (length >= 4) notadd = false;

      //    if(num==1)  narrowbar=true
      // console.log(ans[num])

      if (findAddress && findAddress.address.length)
        (show = true), (addres = findAddress.address);
      else (show = false), (addres = false), (add = true);

      if (req.query.add) {
        add = true;
        show = false;
      }

      //  console.log(findAddress.address)

      const cart = await Cart.aggregate([
        {
          $match: { userId: user },
        },
        {
          $unwind: "$cartItems",
        },
        {
          $lookup: {
            from: "products",
            localField: "cartItems.product",
            foreignField: "_id",
            as: "carted",
          },
        },
        {
          $project: {
            item: "$cartItems.product",
            quantity: "$cartItems.quantity",
            carted: { $arrayElemAt: ["$carted", 0] },
          },
        },
      ]);

      console.log(
        "888888888888888888888888888888888888888888888888888888888888888888888888888888888888888"
      );
      console.log(cart.category);

      cart.find((a) => {
        console.log(a.carted.category);
      });

      res.render("user/checkout", {
        user: req.user,
        show,
        add,
        edit,
        num,
        count,
        narrowbar,
        notadd,
        ans,
        addres,
        flash: flashMessage ? flashMessage : {},
        cart,
        cartlengths,
        wishlistcount,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  addressEdit: asyncHandler(async (req, res, next) => {
    try {
      var existingAddressIndex;
      var index = req.body.index;

      const userId = req.user.userId;
      const address = {
        name: req.body.name,
        locality: req.body.locality,
        city: req.body.city,
        pincode: req.body.pincode,
        state: req.body.state,
        mobileNumber: req.body.mobile,
        address: req.body.address,
      };

      let find = await Address.findOne({ user: userId });
      if (!find) {
        // If no address found, create a new one
        find = new Address({ user: userId, address: [address] });
      } else {
        // Check if the address to update exists
        // existingAddressIndex = find.address(addr => addr._id.toString() === req.body.value);
        existingAddressIndex = find.address.findIndex(
          (addr) => addr._id.toString() === req.body.value
        );

        console.log(existingAddressIndex);
        if (existingAddressIndex !== -1) {
          // Update the existing address
          find.address[existingAddressIndex] = address;
        } else {
          // Add a new address
          find.address.push(address);
        }
      }
      if (existingAddressIndex == -1) {
        existingAddressIndex = 0;
      }

      await find.save();
      req.flash("message", "sucesfuly created");
      res.redirect(`/checkout?number=${index}`);

      //     if(!find){
      //         console.log("keri")

      //     const userAddress=await Address({
      //         user:userId,
      //         address:[address]
      //     })

      //     await userAddress.save()
      //     req.flash('message','sucesfuly created')
      //     res.redirect('/checkout')
      // }else{
      //     const userAddress=await Address.findOneAndUpdate(

      //         {user:userId},
      //         {address:[address]}
      //     )

      //     await userAddress.save()
      //     req.flash('message','sucesfuly updated')
      //      res.redirect('/checkout')
      // }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  deleteAddress: asyncHandler(async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const addres = req.query.delete;

      const deleteAddres = await Address.findOneAndUpdate(
        { user: userId },
        { $pull: { address: { _id: new ObjectId(addres) } } },
        { new: true }
      );

      res.redirect("/checkout");
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  postCheckout: asyncHandler(async (req, res, next) => {
    try {
      //  instane for razorpay

      var instance = new Razorpay({
        key_id: process.env.RAZORPAY_ID,
        key_secret: process.env.RAZORPAY_SECRET,
      });

      const userId = req.user.userId;
      const data = req.body;
      console.log(data);

      //     updating coupon of user
      console.log(
        "pppppppppppppppppppppppppppppp888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888"
      );
      if (data.couponCode) {
        const updated = await User.updateOne(
          { _id: new ObjectId(userId) },
          {
            $push: {
              coupons: data.couponCode,
            },
          }
        );
      }

      //checking address
      const address = await Address.findOne({ user: new ObjectId(userId) });
      if (!address) {
        return res.json({ status: false, message: "Enter Address" });
      }
      if (address.address.length == 0) {
        return res.json({ status: false, message: "Enter Address" });
      }

      //check stock
      console.log(userId);

      const product = await Cart.findOne({ userId }).populate(
        "cartItems.product"
      );
      console.log(product);
      console.log(product.cartItems);
      if (!product) {
        return res.json({ status: false, message: "OPPS! Oder Failed" });
      }
      if (product.cartItems.length <= 0) {
        return res.json({ status: false, message: "OPPS! Oder Failed" });
      }
      const cartProducts = product.cartItems;
      console.log(cartProducts);

      //check quantity
      let array = [];

      let productStock = true;
      let productQuantity = true;
      let checkAvailability = true;

      for (const cartProduct of cartProducts) {
        const productId = cartProduct.product;
        const quantity = cartProduct.quantity;

        if (cartProduct.product.stock < cartProduct.quantity) {
          productStock = false;
          array.push(cartProduct.product.name);
        }

        if (cartProduct.quantity <= 0) {
          productQuantity = false;
          array.push(cartProduct.product.name);
        }

        console.log(cartProduct.product.stock);
        console.log(cartProduct.quantity);
      }

      if (productQuantity == false) {
        return res.json({
          oderFailed: false,
          message: "OPPS! Oder Failed ",
          array,
        });
      }

      // check product unavailability
      let showAvailability = [];

      for (let avl of cartProducts) {
        if (avl.product.status == true) {
          array.push(avl.product.name);
          checkAvailability = false;
        }
      }

      if (checkAvailability == false) {
        console.log(
          "66666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666"
        );
        return res.json({
          oderFailed: false,
          message: "OOPS! products unavilable ",
          array,
        });
      }

      if (productStock && checkAvailability) {
        if (data.paymentOption === "cod") {
          //upate stock
          const products = await Cart.findOne({ userId: userId });
          console.log("837483789374934983758375555555555555555");
          console.log(products);
          const cartProducts = products.cartItems;

          for (const cartProduct of cartProducts) {
            const productId = cartProduct.product;
            const quantity = cartProduct.quantity;

            const product = await Product.findOne({ _id: productId });
            console.log(product);
            console.log(
              "8374837893749349837583755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555"
            );
            console.log(cartProduct.quantity);
            console.log(product.stock);
            if (cartProduct.quantity > product.stock) {
              await Cart.deleteOne({ userId: new ObjectId(userId) });
              return res.json({ status: false, message: "out of stock" });
            }

            await Product.updateOne(
              { _id: productId },
              { $inc: { stock: -quantity } }
            );
          }

          //place oder

          const productDetails = await Cart.aggregate([
            {
              $match: {
                userId: new ObjectId(userId),
              },
            },
            {
              $unwind: "$cartItems",
            },
            {
              $project: {
                item: "$cartItems.product",
                quantity: "$cartItems.quantity",
              },
            },
            {
              $lookup: {
                from: "products",
                localField: "item",
                foreignField: "_id",
                as: "productDetails",
              },
            },
            {
              $unwind: "$productDetails",
            },
            {
              $project: {
                productId: "$productDetails._id",
                productName: "$productDetails.name",
                productPrice: "$productDetails.price",
                quantity: "$quantity",
                category: "$productDetails.category",
                image: "$productDetails.images",
              },
            },
          ]);

          const addressData = await Address.aggregate([
            {
              $match: { user: userId },
            },
            {
              $unwind: "$address",
            },
            {
              $match: { "address._id": new ObjectId(data.address) },
            },
            {
              $project: { item: "$address" },
            },
          ]);

          let status = "success";
          let oderStatus = "placed";

          const oderData = {
            _id: new ObjectId(),
            name: addressData[0].item.name,
            paymentStatus: status,
            paymentMethod: data.paymentOption,
            productDetails: productDetails,
            shippingAddress: addressData[0],
            oderstatus: oderStatus,
            totalPrice: data.total,
            discountPercentage: data.discountPercentage,
            discountAmount: data.discountAmount,
            couponCode: data.couponCode,
            cancelStatus: "false",
            createdAt: new Date(),
          };

          const oder = await Oder.findOne({ user: userId });

          if (oder) {
            console.log(oder);

            const ans = await Oder.updateOne(
              { user: new ObjectId(userId) },
              {
                $push: { oders: oderData },
              }
            );
            console.log(ans);
          } else {
            // console.log(oderData)

            const newOder = await Oder({
              user: new ObjectId(userId),
              oders: [oderData],
            });

            console.log(newOder);

            await newOder.save();
          }
          await Cart.deleteOne({ userId: new mongoose.Types.ObjectId(userId) });
          return res.json({
            codStatus: true,
            message: "Oder Succesfuly Placed",
          });
        } else if (data.paymentOption === "Wallet") {
          // checking wallet have amount

          const userData = await User.findById({ _id: userId });

          if (userData.Wallet === 0) {
            return res.json({
              walletStatus: false,
              message: "The wallet is empty",
            });
          }

          if (userData.Wallet < data.total) {
            return res.json({
              walletStatus: false,
              message: "The wallet have no enough money",
            });
          } else {
            userData.Wallet -= data.total;
          }
          await userData.save();

          let status = "success";
          let oderStatus = "placed";

          const walletTransaction = {
            date: new Date(),
            type: "Debit",
            amount: data.total,
          };

          const updatedWallet = await User.updateOne(
            { _id: userId },
            { $push: { WalletTransaction: walletTransaction } }
          );
          console.log(updatedWallet);

          //upate stock
          const products = await Cart.findOne({ userId: userId });

          const cartProducts = products.cartItems;

          for (const cartProduct of cartProducts) {
            const productId = cartProduct.product;
            const quantity = cartProduct.quantity;

            const product = await Product.findOne({ _id: productId });
            console.log(product);

            if (cartProduct.quantity > product.stock) {
              await Cart.deleteOne({ userId: new ObjectId(userId) });
              return res.json({ status: false, message: "out of stock" });
            }

            await Product.updateOne(
              { _id: productId },
              { $inc: { stock: -quantity } }
            );
          }

          //place oder

          const productDetails = await Cart.aggregate([
            {
              $match: {
                userId: new ObjectId(userId),
              },
            },
            {
              $unwind: "$cartItems",
            },
            {
              $project: {
                item: "$cartItems.product",
                quantity: "$cartItems.quantity",
              },
            },
            {
              $lookup: {
                from: "products",
                localField: "item",
                foreignField: "_id",
                as: "productDetails",
              },
            },
            {
              $unwind: "$productDetails",
            },
            {
              $project: {
                productId: "$productDetails._id",
                productName: "$productDetails.name",
                productPrice: "$productDetails.price",
                quantity: "$quantity",
                category: "$productDetails.category",
                image: "$productDetails.images",
              },
            },
          ]);

          const addressData = await Address.aggregate([
            {
              $match: { user: userId },
            },
            {
              $unwind: "$address",
            },
            {
              $match: { "address._id": new ObjectId(data.address) },
            },
            {
              $project: { item: "$address" },
            },
          ]);

          const oderData = {
            _id: new ObjectId(),
            name: addressData[0].item.name,
            paymentStatus: status,
            paymentMethod: data.paymentOption,
            productDetails: productDetails,
            shippingAddress: addressData[0],
            oderstatus: oderStatus,
            totalPrice: data.total,
            discountPercentage: data.discountPercentage,
            cancelStatus: "false",
            createdAt: new Date(),
          };

          const oder = await Oder.findOne({ user: userId });

          if (oder) {
            console.log(oder);

            const ans = await Oder.updateOne(
              { user: new ObjectId(userId) },
              {
                $push: { oders: oderData },
              }
            );
            console.log(ans);
          } else {
            // console.log(oderData)

            const newOder = await Oder({
              user: new ObjectId(userId),
              oders: [oderData],
            });

            console.log(newOder);

            await newOder.save();
          }
          await Cart.deleteOne({ userId: new mongoose.Types.ObjectId(userId) });
          return res.json({
            orderStatus: true,
            message: "order placed successfully",
          });
        } else if (data.paymentOption == "Walletwithrazarupay") {
          //           //            checking wallet have amount

          //     const userData=await User.findById({_id:userId})

          //     if(userData.Wallet<=0){
          //         return res.json({status:false,message:"The wallet is empty"})
          //     }

          //       userData.Wallet-=data.decresedAmount

          //     await userData.save()

          //     const walletTransaction={
          //       date:new Date(),
          //       type:'Debit',
          //       amount:data.decresedAmount
          //     }

          //     const updatedWallet=await User.updateOne(
          //       {_id:userId},
          //       {$push:{WalletTransaction:walletTransaction}}
          //     )
          //     console.log(updatedWallet)

          //     //upate stock
          // const products=await Cart.findOne({userId:userId})

          // const cartProducts=products.cartItems

          // for(const cartProduct of cartProducts){
          //     const productId=cartProduct.product
          //     const quantity=cartProduct.quantity

          // const product=await Product.findOne({_id:productId})
          // console.log(product)

          // if(cartProduct.quantity >product.stock){
          //     await Cart.deleteOne({userId:new ObjectId(userId)})
          //     return res.json({status:false,message:"out of stock"})

          // }

          // await  Product.updateOne({_id:productId},
          //     {$inc:{stock:-quantity}}
          // )

          // }

          //place oder

          const productDetails = await Cart.aggregate([
            {
              $match: {
                userId: new ObjectId(userId),
              },
            },
            {
              $unwind: "$cartItems",
            },
            {
              $project: {
                item: "$cartItems.product",
                quantity: "$cartItems.quantity",
              },
            },
            {
              $lookup: {
                from: "products",
                localField: "item",
                foreignField: "_id",
                as: "productDetails",
              },
            },
            {
              $unwind: "$productDetails",
            },
            {
              $project: {
                productId: "$productDetails._id",
                productName: "$productDetails.name",
                productPrice: "$productDetails.price",
                quantity: "$quantity",
                category: "$productDetails.category",
                image: "$productDetails.images",
              },
            },
          ]);

          const addressData = await Address.aggregate([
            {
              $match: { user: userId },
            },
            {
              $unwind: "$address",
            },
            {
              $match: { "address._id": new ObjectId(data.address) },
            },
            {
              $project: { item: "$address" },
            },
          ]);

          let status = "Pending";
          let oderStatus = "Pending";

          const oderData = {
            _id: new ObjectId(),
            name: addressData[0].item.name,
            paymentStatus: status,
            paymentMethod: data.paymentOption,
            productDetails: productDetails,
            shippingAddress: addressData[0],
            oderstatus: oderStatus,
            totalPrice: data.total,
            reducedAmount: data.decresedAmount,
            discountPercentage: data.discountPercentage,
            cancelStatus: "false",
            createdAt: new Date(),
          };

          const oder = await Oder.findOne({ user: userId });

          if (oder) {
            console.log(oder);

            const ans = await Oder.updateOne(
              { user: new ObjectId(userId) },
              {
                $push: { oders: oderData },
              }
            );
            console.log(ans);
          } else {
            // console.log(oderData)

            const newOder = await Oder({
              user: new ObjectId(userId),
              oders: [oderData],
            });

            console.log(newOder);

            await newOder.save();
          }

          {
            let orders = await Oder.find({ user: userId });
            let order = orders[0].oders.slice().reverse();
            let orderId = order[0]._id;

            var options = {
              amount: data.total * 100,
              currency: "INR",
              receipt: " " + orderId,
            };
            instance.orders.create(options, function (err, order) {
              if (err) {
                console.log(err);
              } else {
                console.log(order);
                return res.json(order);
              }
            });
          }
        } else {
          //place oder

          const productDetails = await Cart.aggregate([
            {
              $match: {
                userId: new ObjectId(userId),
              },
            },
            {
              $unwind: "$cartItems",
            },
            {
              $project: {
                item: "$cartItems.product",
                quantity: "$cartItems.quantity",
              },
            },
            {
              $lookup: {
                from: "products",
                localField: "item",
                foreignField: "_id",
                as: "productDetails",
              },
            },
            {
              $unwind: "$productDetails",
            },
            {
              $project: {
                productId: "$productDetails._id",
                productName: "$productDetails.name",
                productPrice: "$productDetails.price",
                quantity: "$quantity",
                category: "$productDetails.category",
                image: "$productDetails.images",
              },
            },
          ]);

          const addressData = await Address.aggregate([
            {
              $match: { user: userId },
            },
            {
              $unwind: "$address",
            },
            {
              $match: { "address._id": new ObjectId(data.address) },
            },
            {
              $project: { item: "$address" },
            },
          ]);

          let status = "Pending";
          let oderStatus = "Pending";

          const oderData = {
            _id: new ObjectId(),
            name: addressData[0].item.name,
            paymentStatus: status,
            paymentMethod: data.paymentOption,
            productDetails: productDetails,
            shippingAddress: addressData[0],
            oderstatus: oderStatus,
            totalPrice: data.total,
            discountPercentage: data.discountPercentage,
            cancelStatus: "false",
            createdAt: new Date(),
          };

          const oder = await Oder.findOne({ user: userId });

          if (oder) {
            console.log(oder);

            const ans = await Oder.updateOne(
              { user: new ObjectId(userId) },
              {
                $push: { oders: oderData },
              }
            );
            console.log(ans);
          } else {
            // console.log(oderData)

            const newOder = await Oder({
              user: new ObjectId(userId),
              oders: [oderData],
            });

            console.log(newOder);

            await newOder.save();
          }

          {
            let orders = await Oder.find({ user: userId });
            let order = orders[0].oders.slice().reverse();
            let orderId = order[0]._id;

            var options = {
              amount: data.total * 100,
              currency: "INR",
              receipt: " " + orderId,
            };
            instance.orders.create(options, function (err, order) {
              if (err) {
                console.log(err);
              } else {
                console.log(order);
                return res.json(order);
              }
            });
          }
        }

        // res.json({status:'OrderFailed'})
        // await Cart.deleteOne({userId: new  mongoose.Types.ObjectId(userId)})
      } else {
        // return res.json({status:false,message:'out off stock'})
        // await Cart.deleteOne({userId: new  mongoose.Types.ObjectId(userId)})
        // await Cart.deleteOne({userId: new  mongoose.Types.ObjectId(userId)})
        return res.json({
          oderFailed: false,
          message: "OPPS! Oder Failed  product Out of Stock",
          array,
        });
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  directBuy: asyncHandler(async (req, res, next) => {
    try {
      console.log("dsfksdlkfsdfsdjmflkdsmflksdmflksdmfd");

      const productId = req.params.id;

      if (productId) {
        const product = await Product.findById(productId);
        if (product.stock <= 0) {
          return res
            .status(200)
            .json({ message: "out of stock", success: false });
        }
        return res.status(200).json({ success: true });
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  oderDirectBuy: asyncHandler(async (req, res, next) => {
    try {
      // for cart lenght
      const UId = req.user.userId;
      const cart = await Cart.findOne({ userId: UId });
      let cartlengths;
      if (cart) {
        if (cart.cartItems) {
          cartlengths = cart.cartItems.length;
        } else {
          cartlengths = 0;
        }
      } else {
        cartlengths = 0;
      }

      var show;
      var addres;
      var add;

      var notadd = true;
      var narrowbar = false;

      var edit = false;
      if (req.query.edit) {
        edit = true;
      }

      let num = parseInt(req.query.number) || 0;

      const flashMessage = req.flash("message");
      const userId = req.user.userId;
      const user = new mongoose.Types.ObjectId(userId);
      console.log("hereeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
      console.log(userId);
      const findAddress = await Address.findOne({ user: userId });

      const find = await Address.findOne({ user: userId });
      let count = 0;

      if (find) {
        count = find.address.length;
      }

      let ans;
      let length;
      if (findAddress) {
        if (findAddress.address.length) {
          ans = findAddress.address[num];
          length = findAddress.address.length;
        }
      }

      if (length >= 4) notadd = false;

      if (findAddress) {
        if (findAddress.address.length)
          (show = true), (addres = findAddress.address);
        else (show = false), (addres = false), (add = true);
      } else {
        (show = false), (addres = false), (add = true);
      }
      console.log(334343434);
      if (req.query.add) {
        add = true;
        show = false;
        num = 1;
      }

      const productId = req.query.id;

      const product = await Product.findById(productId);

      console.log(product);

      res.render("user/direct-Buy", {
        user: req.user,
        show,
        add,
        edit,
        num,
        count,
        narrowbar,
        notadd,
        ans,
        addres,
        flash: flashMessage ? flashMessage : {},
        product,
        cartlengths,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  directBuyProduct: asyncHandler(async (req, res, next) => {
    try {
      console.log("vanu");

      const userId = req.user.userId;
      const data = req.body;
      let productStock = true;

      //checking address
      const address = await Address.findOne({ user: new ObjectId(userId) });
      if (address) {
        if (address.address.length == 0) {
          return res.json({ status: false, message: "enter address" });
        }
      } else {
        return res.json({ status: false, message: "enter address" });
      }

      //check stock
      console.log(data.productId);
      const product = await Cart.findOne({ userId: userId }).populate(
        "cartItems.product"
      );
      console.log(product);
      const cartProducts = product.cartItems;

      //check quantity
      for (const cartProduct of cartProducts) {
        const productId = cartProduct.product;
        const quantity = cartProduct.quantity;

        if (product.stock < cartProduct.quantity || cartProduct.quantity <= 0) {
          productStock = false;
        }
      }

      if (productStock) {
        if (data.paymentOption === "cod") {
          //upate stock
          const products = await Cart.findOne({ userId: userId });
          console.log("837483789374934983758375555555555555555");
          console.log(products);
          const cartProducts = products.cartItems;

          for (const cartProduct of cartProducts) {
            const productId = cartProduct.product;
            const quantity = cartProduct.quantity;

            const product = await Product.findOne({ _id: productId });
            console.log(product);
            console.log(
              "8374837893749349837583755555555555555555555555555555555555555555555555555555555555555555555555555555555555555555"
            );
            console.log(cartProduct.quantity);
            console.log(product.stock);
            if (cartProduct.quantity > product.stock) {
              await Cart.deleteOne({ userId: new ObjectId(userId) });
              return res.json({ status: false, message: "out of stock" });
            }

            await Product.updateOne(
              { _id: productId },
              { $inc: { stock: -quantity } }
            );
          }

          //place oder

          const productDetails = await Product.aggregate([
            {
              $match: {
                _id: new ObjectId(data.productId),
              },
            },
            {
              $project: {
                productId: "$_id",
                productName: "$name",
                productPrice: "$price",
                quantity: { $add: [1] },
                category: "$category",
                image: "$images",
              },
            },
          ]);
          console.log(
            "amdfkns produt kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkdetails"
          );
          console.log(productDetails);

          const addressData = await Address.aggregate([
            {
              $match: { user: userId },
            },
            {
              $unwind: "$address",
            },
            {
              $match: { "address._id": new ObjectId(data.address) },
            },
            {
              $project: { item: "$address" },
            },
          ]);
          console.log(req.body.address);
          console.log(
            "a mmmmmmmmmmmmmmmmmmmmmmmm      adddddddddddddddddddddddddddddddddddd"
          );

          console.log(addressData);

          let status = "success";
          let oderStatus = "placed";

          const oderData = {
            _id: new ObjectId(),
            name: addressData[0].item.name,
            paymentStatus: status,
            paymentMethod: data.paymentOption,
            productDetails: productDetails,
            shippingAddress: addressData[0],
            oderstatus: oderStatus,
            totalPrice: productDetails[0].productPrice,
            discountPercentage: data.discountPercentage,
            cancelStatus: "false",
            createdAt: new Date(),
          };

          console.log(oderData);

          const oder = await Oder.findOne({ user: userId });

          if (oder) {
            console.log(oder);

            const ans = await Oder.updateOne(
              { user: new ObjectId(userId) },
              {
                $push: { oders: oderData },
              }
            );
            console.log(ans);
          } else {
            // console.log(oderData)

            const newOder = await Oder({
              user: new ObjectId(userId),
              oders: [oderData],
            });

            console.log(newOder);

            await newOder.save();
          }

          res.json({ status: true, message: "succesfuly odered" });
          await Cart.deleteOne({ userId: new mongoose.Types.ObjectId(userId) });
        }
      } else {
        // return res.json({status:false,message:'out off stock'})
        await Cart.deleteOne({ userId: new mongoose.Types.ObjectId(userId) });
        // await Cart.deleteOne({userId: new  mongoose.Types.ObjectId(userId)})
        return res.json({ status: false, message: "OPPS! Oder Failed" });
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  directBuyAddressEdit: asyncHandler(async (req, res, next) => {
    try {
      var existingAddressIndex;
      var index = req.body.index;
      var productId = req.body.productId;

      const userId = req.user.userId;
      const address = {
        name: req.body.name,
        locality: req.body.locality,
        city: req.body.city,
        pincode: req.body.pincode,
        state: req.body.state,
        mobileNumber: req.body.mobile,
        address: req.body.address,
      };

      let find = await Address.findOne({ user: userId });
      if (!find) {
        // If no address found, create a new one
        find = new Address({ user: userId, address: [address] });
      } else {
        // Check if the address to update exists
        // existingAddressIndex = find.address(addr => addr._id.toString() === req.body.value);
        existingAddressIndex = find.address.findIndex(
          (addr) => addr._id.toString() === req.body.value
        );

        console.log(existingAddressIndex);
        if (existingAddressIndex !== -1) {
          // Update the existing address
          find.address[existingAddressIndex] = address;
        } else {
          // Add a new address
          find.address.push(address);
        }
      }
      if (existingAddressIndex == -1) {
        existingAddressIndex = 0;
      }

      await find.save();
      console.log(index);
      req.flash("message", "sucesfuly created");
      res.redirect(`/oder-direct-buy?number=${index}&id=${productId}`);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  directBuyAddresDelete: asyncHandler(async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const addres = req.query.delete;
      const productId = req.query.id;

      console.log(addres);
      console.log(productId);

      const deleteAddres = await Address.findOneAndUpdate(
        { user: userId },
        { $pull: { address: { _id: new ObjectId(addres) } } },
        { new: true }
      );

      res.redirect(`/oder-direct-buy?id=${productId}`);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  getOderList: asyncHandler(async (req, res, next) => {
    try {
      // for cart lenght
      const Id = req.user.userId;
      const userId = req.user.userId;
      const cart = await Cart.findOne({ userId: Id });
      let cartlengths;
      let wishlistcount = 0;
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

      // pagination
      let page = parseInt(req.query.page) || 1;
      let limit = 6;
      let skip = (page - 1) * limit;

      let countOders = await Oder.findOne({ user: userId });
      let totalCount = 0;

      if (countOders) {
        if (countOders.oders) {
          console.log(countOders.oders);
          totalCount = countOders.oders.length;
        }
      }

      let totalPages = Math.ceil(totalCount / limit);

      const user = req.user.userId;
      const oders = await Oder.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(user) } },
        { $unwind: "$oders" },
        { $sort: { "oders.createdAt": -1 } },
        { $skip: skip },
        { $limit: limit },
      ]);
      console.log(oders);

      res.render("user/oderList", {
        oders,
        user: req.user,
        cartlengths,
        wishlistcount,
        totalPages,
        currentPage: page,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  getOderDetails: asyncHandler(async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const productId = req.query.id;

      if (productId) {
        const order = await Oder.findOne({ user: userId });

        const list = order.oders.find(
          (first) => first._id.toString() === productId
        );
        console.log(list);
        res.render("user/oderDetails", { list });
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  cancelOder: asyncHandler(async (req, res, next) => {
    try {
      const oderId = req.body.orderId;
      const status = req.body.status;
      const reason = req.body.reason;

      console.log(reason);
      const oder = await Oder.updateOne(
        { "oders._id": new ObjectId(oderId) },
        {
          $set: {
            "oders.$.oderstatus": status,
            "oders.$.reason": reason,
          },
        },
        { new: true }
      );
      console.log(
        "asssssssssssssddddddddddddedddddddddddddddddddddddddddddddddd"
      );

      if (oder) return res.json({ status: true });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  ///////////////                     ADMIN      /////////////////////
  adminOderList: asyncHandler(async (req, res, next) => {
    try {
      // pagination
      let page = parseInt(req.query.page) || 1;
      let limit = 6;
      let skip = (page - 1) * limit;

      let countOders = await Oder.find({});

      let totalCount = 0;

      if (countOders) {
        countOders.forEach((order) => {
          if (order.oders) {
            totalCount += order.oders.length;
          }
        });
      }

      let totalPages = Math.ceil(totalCount / limit);

      const order = await Oder.aggregate([
        { $unwind: "$oders" },
        { $sort: { "oders.createdAt": -1 } },
        { $skip: skip },
        { $limit: limit },
      ]);

      console.log("am oder");
      console.log(order);

      res.render("admin/admin-oderList", {
        order,
        totalPages,
        currentPage: page,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  oderStatusChange: asyncHandler(async (req, res, next) => {
    try {
      const oderId = req.body.oderId;
      const status = req.body.status;
      console.log(
        "ammmmmmmmmmmmmmmm herrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr"
      );
      console.log(status);

      await Oder.updateOne(
        { "oders._id": new ObjectId(oderId) },
        {
          $set: { "oders.$.oderstatus": status },
        }
      );
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  adminCancelOder: asyncHandler(async (req, res, next) => {
    try {
      const userId = req.body.userId;
      const oderId = req.body.oderId;
      const status = req.body.status;

      const orders = await Oder.findOne({ "oders._id": new ObjectId(oderId) });
      const Oders = orders.oders.find((order) => order._id == oderId);

      if (Oders.paymentMethod == "cod") {
        if (status == "Cancel Accepted") {
          await Oder.updateOne(
            { "oders._id": new ObjectId(oderId) },
            {
              $set: {
                "oders.$.cancelStatus": status,
                "oders.$.oderstatus": status,
                "oders.$.paymentStatus": "NO REFUND",
              },
            }
          );
          //add to stock
          const cartProducts = Oders.productDetails;
          console.log(cartProducts);
          console.log("updaaaaaaaaaaaaating");
          for (const cartProduct of cartProducts) {
            const productId = cartProduct.productId;
            const quantity = cartProduct.quantity;

            const product = await Product.findOne({ _id: productId });

            await Product.updateOne(
              { _id: productId },
              { $inc: { stock: quantity } }
            );
          }
        } else if (status === "Cancel Declined") {
          await Oder.updateOne(
            { "oders._id": new ObjectId(oderId) },
            {
              $set: {
                "oders.$.cancelStatus": status,
                "oders.$.oderstatus": status,
                "oders.$.paymentStatus": "NO REFUND",
              },
            }
          );
        }
      } else if (
        Oders.paymentMethod == "Wallet" ||
        Oders.paymentMethod == "razorpay"
      ) {
        console.log(oderId);
        if (status == "Cancel Accepted") {
          await Oder.updateOne(
            { "oders._id": new ObjectId(oderId) },
            {
              $set: {
                "oders.$.cancelStatus": status,
                "oders.$.oderstatus": status,
                "oders.$.paymentStatus": "Refund Credit to Wallet",
              },
            }
          );

          //add to stock
          const cartProducts = Oders.productDetails;
          console.log(cartProducts);

          for (const cartProduct of cartProducts) {
            const productId = cartProduct.productId;
            const quantity = cartProduct.quantity;

            const product = await Product.findOne({ _id: productId });

            await Product.updateOne(
              { _id: productId },
              { $inc: { stock: quantity } }
            );
          }

          //   return fund to wallet

          const user = await User.findOne({ _id: new ObjectId(userId) });
          console.log(user.Wallet);
          user.Wallet += parseInt(Oders.totalPrice);
          await user.save();
          console.log(user.Wallet);

          const walletTransaction = {
            date: new Date(),
            type: "Credit",
            amount: Oders.totalPrice,
          };

          let walletUpdated = await User.updateOne(
            { _id: userId },
            {
              $push: { WalletTransaction: walletTransaction },
            }
          );
          console.log(walletUpdated);
        } else if (status === "Cancel Declined") {
          await Oder.updateOne(
            { "oders._id": new ObjectId(oderId) },
            {
              $set: {
                "oders.$.cancelStatus": status,
                "oders.$.oderstatus": status,
                "oders.$.paymentStatus": "NO REFUND",
              },
            }
          );
        }
      } else if (Oders.paymentMethod == "Walletwithrazarupay") {
        if (status == "Cancel Accepted") {
          await Oder.updateOne(
            { "oders._id": new ObjectId(oderId) },
            {
              $set: {
                "oders.$.cancelStatus": status,
                "oders.$.oderstatus": status,
                "oders.$.paymentStatus": "Refund Credit to Wallet",
              },
            }
          );

          //add to stock
          const cartProducts = Oders.productDetails;
          console.log(cartProducts);

          for (const cartProduct of cartProducts) {
            const productId = cartProduct.productId;
            const quantity = cartProduct.quantity;

            const product = await Product.findOne({ _id: productId });

            await Product.updateOne(
              { _id: productId },
              { $inc: { stock: quantity } }
            );
          }

          //   return fund to wallet

          const user = await User.findOne({ _id: new ObjectId(userId) });
          let tot = parseInt(Oders.totalPrice) + parseInt(Oders.reducedAmount);

          console.log(
            "ppppppppppppppppppppppppppppppppppp000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000pppppppppppppppppppppppppppppp"
          );
          console.log(tot);
          user.Wallet += parseInt(tot);

          await user.save();
          console.log(user.Wallet);

          const walletTransaction = {
            date: new Date(),
            type: "Credit",
            amount: tot,
          };

          let walletUpdated = await User.updateOne(
            { _id: userId },
            {
              $push: { WalletTransaction: walletTransaction },
            }
          );
          console.log(walletUpdated);
        } else if (status === "Cancel Declined") {
          await Oder.updateOne(
            { "oders._id": new ObjectId(oderId) },
            {
              $set: {
                "oders.$.cancelStatus": status,
                "oders.$.oderstatus": status,
                "oders.$.paymentStatus": "NO REFUND",
              },
            }
          );
        }
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  returnOder: asyncHandler(async (req, res, next) => {
    try {
      const oderId = req.body.oderId;
      const status = req.body.status;
      const userId = req.body.userId;

      const orders = await Oder.findOne({ "oders._id": new ObjectId(oderId) });
      const Oders = orders.oders.find((order) => order._id == oderId);

      console.log(Oders);
      console.log(status);
      if (Oders.paymentMethod == "cod") {
        console.log(1);
        if (status == "Return Declined") {
          console.log(2);
          await Oder.updateOne(
            { "oders._id": new ObjectId(oderId) },
            {
              $set: {
                "oders.$.cancelStatus": status,
                "oders.$.oderstatus": status,
                "oders.$.paymentStatus": "NO REFUND",
              },
            }
          );
        } else if (status == "Return Accepted") {
          console.log(3);
          await Oder.updateOne(
            { "oders._id": new ObjectId(oderId) },
            {
              $set: {
                "oders.$.cancelStatus": status,
                "oders.$.oderstatus": status,
                "oders.$.paymentStatus": "RETURN CREDITED TO WALLET ",
              },
            }
          );

          //  Refund credited to wallet

          const user = await User.findOne({ _id: userId });
          user.Wallet += parseInt(Oders.totalPrice);

          await user.save();

          const walletTransaction = {
            date: new Date(),
            type: "Credit",
            amount: Oders.totalPrice,
          };

          const walletUpdated = await User.updateOne(
            { _id: userId },
            {
              $push: { walletTransaction: walletTransaction },
            }
          );
        }
      } else if (
        Oders.paymentMethod == "Wallet" ||
        Oders.paymentMethod == "razorpay"
      ) {
        if (status == "Return Accepted") {
          await Oder.updateOne(
            { "oders._id": new ObjectId(oderId) },
            {
              $set: {
                "oders.$.cancelStatus": status,
                "oders.$.oderstatus": status,
                "oders.$.paymentStatus": "Refund Credit to Wallet",
              },
            }
          );

          //add to stock
          const cartProducts = Oders.productDetails;
          console.log(cartProducts);

          for (const cartProduct of cartProducts) {
            const productId = cartProduct.productId;
            const quantity = cartProduct.quantity;

            const product = await Product.findOne({ _id: productId });

            await Product.updateOne(
              { _id: productId },
              { $inc: { stock: quantity } }
            );
          }

          //   return fund to wallet

          const user = await User.findOne({ _id: userId });
          user.Wallet += parseInt(Oders.totalPrice);
          await user.save();

          const walletTransaction = {
            date: new Date(),
            type: "Credit",
            amount: totalPrice,
          };

          const walletUpdated = await User.updateOne(
            { _id: userId },
            {
              $push: { walletTransaction: walletTransaction },
            }
          );
        } else if (status == "Return Declined") {
          await Oder.updateOne(
            { "oders._id": new ObjectId(oderId) },
            {
              $set: {
                "oders.$.cancelStatus": status,
                "oders.$.oderstatus": status,
                "oders.$.paymentStatus": "NO REFUND",
              },
            }
          );
        }
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  adminOderDetails: asyncHandler(async (req, res, next) => {
    try {
      console.log("avnuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuhsdjf");
      const oderId = req.query.id;

      let uId = await Oder.aggregate([
        {
          $match: {
            "oders._id": new ObjectId(oderId),
          },
        },
        {
          $project: {
            _id: 0,
            user: 1,
          },
        },
      ]);
      console.log(uId);
      let userId = uId[0].user.toString();
      let userDetails = await User.findById(userId);
      console.log(userDetails);

      const result = await Oder.aggregate([
        {
          $match: {
            "oders._id": new ObjectId(oderId),
          },
        },
        { $unwind: "$oders" },
      ]);
      console.log(result);

      console.log(
        "dslkfnsdnfdslkfnsdkjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjfdslkj"
      );
      const order = result
        .filter((element) => element.oders._id == oderId)
        .map((element) => element.oders);

      const address = order[0].shippingAddress;
      const product = order[0].productDetails;
      console.log(order);
      console.log(address);
      console.log(product);
      res.render("admin/admin-oder-details", {
        order,
        address,
        product,
        userDetails,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  // payment intregation
  verifyPayment: asyncHandler(async (req, res, next) => {
    try {
      const details = req.body;
      let data = querystring.parse(req.body.data);
      console.log(req.body.paymentOption);
      console.log(details.data);
      console.log(data);
      console.log(data.paymentOption);
      console.log("ammmmm herrrrrrreeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");

      if (data.paymentOption === "Walletwithrazarupay") {
        await Oder.updateOne({});
        let key_secret = process.env.RAZORPAY_SECRET;

        let hmac = crypto.createHmac("sha256", key_secret);

        hmac.update(
          details.payment.razorpay_order_id +
            "|" +
            details.payment.razorpay_payment_id
        );
        hmac = hmac.digest("hex");
        console.log(hmac);
        console.log(req.body.order.receipt);
        if (hmac == details.payment.razorpay_signature) {
          const oderId = req.body.order.receipt.trim();
          const razorpayId = req.body.payment.razorpay_payment_id;
          console.log(oderId);
          // change payment status
          await Oder.updateOne(
            { "oders._id": new ObjectId(oderId) },
            {
              $set: {
                "oders.$.oderstatus": "placed",
                "oders.$.paymentStatus": "success",
                "oders.$.razorpayId": razorpayId,
              },
            }
          );

          //            checking wallet have amount

          const userId = req.user.userId;

          const userData = await User.findById(userId);
          console.log(userData);
          console.log(
            "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
          );

          userData.Wallet -= data.decresedAmount;

          await userData.save();
          console.log(userData);

          const walletTransaction = {
            date: new Date(),
            type: "Debit",
            amount: data.decresedAmount,
          };

          const updatedWallet = await User.updateOne(
            { _id: userId },
            { $push: { WalletTransaction: walletTransaction } }
          );
          console.log(updatedWallet);

          //upate stock
          const products = await Cart.findOne({ userId: userId });

          const cartProducts = products.cartItems;

          for (const cartProduct of cartProducts) {
            const productId = cartProduct.product;
            const quantity = cartProduct.quantity;

            const product = await Product.findOne({ _id: productId });
            console.log(product);

            if (cartProduct.quantity > product.stock) {
              await Cart.deleteOne({ userId: new ObjectId(userId) });
              return res.json({ status: false, message: "out of stock" });
            }

            await Product.updateOne(
              { _id: productId },
              { $inc: { stock: -quantity } }
            );
          }
          console.log("ppyooooooooooooooooooooooooooooooooooooooooo");

          await Cart.deleteOne({ userId: new mongoose.Types.ObjectId(userId) });

          return res.json({ status: true });
        } else {
          res.json({ status: false });
        }
      } else {
        await Oder.updateOne({});
        let key_secret = process.env.RAZORPAY_SECRET;

        let hmac = crypto.createHmac("sha256", key_secret);

        hmac.update(
          details.payment.razorpay_order_id +
            "|" +
            details.payment.razorpay_payment_id
        );
        hmac = hmac.digest("hex");
        console.log(hmac);
        console.log(req.body.order.receipt);
        if (hmac == details.payment.razorpay_signature) {
          const oderId = req.body.order.receipt.trim();
          const razorpayId = req.body.payment.razorpay_payment_id;
          console.log(oderId);
          // change payment status
          await Oder.updateOne(
            { "oders._id": new ObjectId(oderId) },
            {
              $set: {
                "oders.$.oderstatus": "placed",
                "oders.$.paymentStatus": "success",
                "oders.$.razorpayId": razorpayId,
              },
            }
          );

          const userId = req.user.userId;
          //      upate  stock
          const products = await Cart.findOne({ userId: userId });

          const cartProducts = products.cartItems;

          for (const cartProduct of cartProducts) {
            const productId = cartProduct.product;
            const quantity = cartProduct.quantity;

            const product = await Product.findOne({ _id: productId });
            console.log(product);
            if (cartProduct.quantity > product.stock) {
              await Cart.deleteOne({ userId: new ObjectId(userId) });
              return res.json({ status: false, message: "out of stock" });
            }

            await Product.updateOne(
              { _id: productId },
              { $inc: { stock: -quantity } }
            );
          }
          await Cart.deleteOne({ userId: new mongoose.Types.ObjectId(userId) });

          return res.json({ status: true });
        } else {
          res.json({ status: false });
        }
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  paymentFailed: asyncHandler(async (req, res, next) => {
    try {
      //     let userId=req.user.userId
      //     let wallet=await User.findById(userId)

      //     wallet.Wallet+=req.body.decresedAmount

      //     wallet.save()
      //    console.log("upppppppppppppppppppppppppppppppppppppppppppppppppppp")
      //    console.log(req.body.decresedAmount)

      // const order=req.body
      const oderId = req.body.order.receipt.trim();

      const deleted = await Oder.updateOne(
        { "oders._id": new ObjectId(oderId) },
        { $pull: { oders: { _id: new ObjectId(oderId) } } }
      );
      console.log(deleted);
      res.send({ status: true });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  walletrazarupay: asyncHandler(async (req, res, next) => {
    try {
      let userId = req.user.userId;
      console.log(userId);
      let percentage = 0.1;

      // checking cart have value

      let findCart = await Cart.findOne({ userId: new ObjectId(userId) });

      if (!findCart) {
        return res.json({ status: false, message: "cart is empty" });
      }

      if (findCart.cartItems.length == 0) {
        return res.json({ status: false, message: "cart is empty" });
      }

      let value = req.body.value;
      console.log(value);

      let user = await User.findOne({ _id: new ObjectId(userId) });
      console.log(user);
      if (user) {
        console.log("herewre");

        if (user.Wallet == 0) {
          return res.json({ status: false, message: "Wallet is empty" });
        }

        if (user.Wallet <= 0) {
          return res.json({ status: false, message: "Wallet is empty" });
        }

        let deducationAmount = user.Wallet * percentage;

        if (deducationAmount > user.Wallet) {
          return res.json({ status: false, message: "no fund in wallet" });
        }

        user.Wallet -= deducationAmount;
        let decresedAmount = deducationAmount;
        let payamount = value - deducationAmount;

        console.log(req.body.value);
        console.log(decresedAmount);
        console.log(payamount);

        const messages = {
          text: `balance pay  Amount : ${payamount}`,
        };

        return res.json({
          status: true,
          message: payamount,
          decresedAmount: decresedAmount,
        });
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }),
  downloadInvoice: async (req, res, next) => {
    try {
      const id = req.query.id;
      const userId = req.user.userId;

      let orders = await Oder.aggregate([
        {
          $match: {
            "oders._id": new ObjectId(id),
            user: new ObjectId(userId),
          },
        },
        {
          $unwind: "$oders",
        },
      ]);
      const result = orders
        .filter((element) => {
          if (element.oders._id == id) {
            return true;
          }
          false;
        })
        .map((element) => element.oders);

      const date = result[0].createdAt.toLocaleString();
      const product = result[0].productDetails;

      const order = {
        id: id,
        total: parseInt(result[0].totalPrice),
        date: date,
        payment: result[0].paymentMethod,
        name: result[0].shippingAddress.item.name,
        street: result[0].shippingAddress.item.address,
        locality: result[0].shippingAddress.item.locality,
        city: result[0].shippingAddress.item.city,
        state: result[0].shippingAddress.item.state,
        pincode: result[0].shippingAddress.item.pincode,
        product: result[0].productDetails,
      };

      const products = order.product.map((product) => {
        return {
          quantity: parseInt(product.quantity),
          description: product.productName,
          "tax-rate": 0,
          price: parseInt(product.productPrice),
        };
      });

      var data = {
        customize: {},
        images: {
          background:
            "https://public.easyinvoice.cloud/img/watermark-draft.jpg",
        },

        sender: {
          company: "TECH_TROVE",
          address: "Brototype",
          zip: "686633",
          city: "maradu",
          country: "india",
        },

        client: {
          company: order.name,
          address: order.addres,
          zip: order.pincode,
          city: order.city,
          country: "india",
        },

        information: {
          number: order.id,
          date: order.date,
          "due-date": "Nil",
        },
        products: products,
        "bottom-notice": "Thank you,Keep shopping.",
      };

      easyinvoice.createInvoice(data, async function (result) {
        //The response will contain a base64 encoded PDF file

        await fs.writeFileSync("invoice.pdf", result.pdf, "base64");

        //      Set the response headers for downloading the file

        res.setHeader(
          "Content-Disposition",
          'attachment; filename="invoice.pdf"'
        );
        res.setHeader("Content-Type", "application/pdf");

        // Create a readable stream from the PDF base64 string
        const pdfStream = new Readable();
        pdfStream.push(Buffer.from(result.pdf, "base64"));
        pdfStream.push(null);

        // Pipe the stream to the response
        pdfStream.pipe(res);
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
};
