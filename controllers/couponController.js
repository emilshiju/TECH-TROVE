import asyncHandler from "express-async-handler";
import coupon from "../models/couponModel.js";
import User from "../models/user.js";
import vocherCode from "voucher-code-generator";
import Cart from "../models/cart.js";
import { ObjectId } from "mongodb";

export default {
  getAddCoupon: async (req, res, next) => {
    try {
      res.render("admin/add-Coupon");
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  addCoupon: async (req, res, next) => {

    try {
      const data = {
        couponCode: req.body.coupon,
        validity: req.body.validity,
        minPurchase: req.body.minPurchase,
        minDiscountPercentage: req.body.minDiscountPercentage,
        maxDiscountValue: req.body.maxDiscount,
        discription: req.body.description,
      };

      let check = await coupon.findOne({ couponCode: data.couponCode });
      if (check) {
        return res.json({ status: false });
      } else {
        console.log(data);
        await coupon(data).save();
        return res.json({ status: true });
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  generateCouponCode: async (req, res, next) => {
    try {
      let codeCoupon = vocherCode.generate({
        length: 6,
        count: 1,
        charset: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        prefix: "TEChTROVE-",
      });

      return res.json({ status: true, codeCoupon: codeCoupon[0] });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  verifyCoupon: async (req, res, next) => {
    try {
    
      const couponCode = req.params.id;
      const userId = req.user.userId;

      const couponExist = await coupon.find({ couponCode: couponCode });

      console.log(userId);
      if (couponExist.length > 0) {
        console.log(new Date());
        if (new Date(couponExist[0].validity) - new Date() > 0) {
          const userCoupon = await User.findOne({
            _id: userId,
            coupons: { $in: [couponCode] },
          });
          console.log(userCoupon);

          if (userCoupon) {
            return res.json({
              status: false,
              message: "Coupon Already Used by User",
            });
          } else {
            return res.json({
              status: true,
              message: "Coupon Added Successfully",
            });
          }
        } else {
          return res.json({ status: false, message: "Coupon have expiried" });
        }
      } else {
        return res.json({ status: false, message: "Coupon doesnt exists" });
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  applyCoupon: async (req, res, next) => {
    try {
      let couponCode = req.query.id;
      // let total =req.query.total

      let userId = req.user.userId;

      let totalAmount = await Cart.aggregate([
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
            as: "carted",
          },
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            product: { $arrayElemAt: ["$carted", 0] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ["$quantity", "$product.price"] } },
          },
        },
      ]);

      console.log(totalAmount[0].total);
      let total = totalAmount[0].total;
      console.log(couponCode);

      let couponExist = await coupon.findOne({ couponCode: couponCode });
      if (couponExist) {
        if (new Date(couponExist.validity) - new Date() > 0) {
          console.log(couponExist.minPurchase);
          if (totalAmount[0].total >= couponExist.minPurchase) {
         
            let discountAmount =
              (total * couponExist.minDiscountPercentage) / 100;

            console.log(discountAmount);
            console.log(couponExist.minDiscountPercentage);

            if (discountAmount > couponExist.maxDiscountValue) {
              discountAmount = couponExist.maxDiscountValue;

              return res.json({
                status: true,
                discountAmount: discountAmount,
                discount: couponExist.minDiscountPercentage,
                couponCode: couponCode,
              });
            } else {
           
              return res.json({
                status: true,
                discountAmount: discountAmount,
                discount: couponExist.minDiscountPercentage,
                couponCode: couponCode,
              });
            }
          } else {
            return res.json({
              status: false,
              message: `minimun purchase amount is ${couponExist.minPurchase}`,
            });
          }
        } else {
          return res.json({ status: false, message: "Coupon Expired" });
        }
      } else {
        return res.json({ status: false, message: "Coupon doesnt Exists" });
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  listCoupon: async (req, res, next) => {
    try {
      var errorMessage;

      if (req.query.value) {
        errorMessage = req.flash("message");
      }
   
      const couponList = await coupon.find();
      console.log(couponList);
      res.render("admin/coupon-List", {
        couponList,
        message: errorMessage,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  removeCoupon: async (req, res, next) => {
    try {
      const couponId = req.body.couponId;
      await coupon.deleteOne({ _id: couponId });

      return res.json({ status: true });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  getEditCoupon: asyncHandler(async (req, res, next) => {
    try {
      let couponId = req.params.id;
      console.log(couponId);
      let findCoupon = await coupon.findById(couponId);

      res.render("admin/edit-coupon", { findCoupon });
    } catch (error) {
      next(error);
    }
  }),
  editCoupon: asyncHandler(async (req, res, next) => {
    try {
      let couponId = req.body.couponId;
      const data = {
        couponCode: req.body.coupon,
        validity: req.body.validity,
        minPurchase: req.body.minPurchase,
        minDiscountPercentage: req.body.minDiscountPercentage,
        maxDiscountValue: req.body.maxDiscount,
        discription: req.body.description,
      };
      let updateCoupon = await coupon.updateOne({ _id: couponId }, data);
      return res.json({ status: true });
    } catch (error) {
      next(error);
    }
  }),
};
