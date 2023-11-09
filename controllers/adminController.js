import asyncHandler from "express-async-handler";
import User from "../models/user.js";
import bcrpt from "bcrypt";
import jwt from "jsonwebtoken";
import Order from "../models/oder.js";
import { YearlyInstance } from "twilio/lib/rest/api/v2010/account/usage/record/yearly.js";
import Oder from "../models/oder.js";
import Category from "../models/category.js";
import Product from "../models/product.js";

export default {
  getAdminLogin: asyncHandler(async (req, res) => {
    res.render("admin/admin-Login");
  }),
  getDashboad: asyncHandler(async (req, res) => {
    res.render("admin/admin-Home");
  }),
  adminLogin: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    console.log(email);
    console.log(password);
    try {
      if (!email || !password) {
        return res.render("admin/admin-Login", { message: "invalid entry" });
      }

      if (email === "admin@gmail.com" && password === "1") {
        const secretKey = process.env.JWT_ADMIN_SECRET;
        const token = jwt.sign({ adminId: "logedIn" }, secretKey, {
          expiresIn: "1d",
        });
        console.log("amm tokennn");
        console.log(token);
        res.cookie("adminjwt", token, { httpOnly: true }); // Set the JWT as a cookie
        res.redirect("/dashboard");
        // res.render('admin/admin-Home')
      } else {
        return res.render("admin/admin-Login", { message: "invalid entry" });
      }
    } catch (error) {
      console.log(error);
    }
  }),
  adminLogout: asyncHandler((req, res) => {
  
    try {
  

      res.clearCookie("adminjwt");
      res.redirect("/admin");
    } catch (error) {
      console.log(error);
    }
  }),
  getAllUser: asyncHandler(async (req, res) => {
    try {
      let users = await User.find({});
      console.log(users);
      console.log("am here" + users.is_blocked);
      users.forEach((users) => {
        console.log(`User: ${users._id}, is_blocked: ${users.is_blocked}`);
      });
      res.render("admin/list-Users", { users });
    } catch (error) {
      console.log(error);
    }
  }),
  blockUser: asyncHandler(async (req, res) => {
    try {
      const id = req.params.user;
      console.log("am here");
      await User.findByIdAndUpdate({ _id: id }, { $set: { is_blocked: true } });
      res.send({ status: true });
    } catch (error) {
      console.log(error);
    }
  }),
  unblockUser: asyncHandler(async (req, res) => {
    try {
      const id = req.params.user;
      await User.findByIdAndUpdate(
        { _id: id },
        { $set: { is_blocked: false } }
      );
      res.send({ status: false });
    } catch (error) {
      console.log(error);
    }
  }),
  showUser: asyncHandler(async (req, res) => {
    try {
      const id = req.params.id;
      const user = await User.findOne({ _id: id });
      console.log(user);
      res.render("admin/detailUser", { user });
    } catch (err) {
      console.log(err);
    }
  }),
  //    Sales Report
  getSalesReport: asyncHandler(async (req, res, next) => {
    try {
      let report = await Order.aggregate([
        {
          $unwind: "$oders",
        },
        {
          $match: {
            "oders.oderstatus": "Delivered",
          },
        },
      ]);

      let details = [];
      const getDate = (date) => {
        const orderDate = new Date(date);
        const day = orderDate.getDate();
        const month = orderDate.getMonth() + 1;
        const year = orderDate.getFullYear();

        return `${isNaN(day) ? "00" : day} - ${isNaN(month) ? "00" : month} - ${
          isNaN(year) ? "000" : year
        }`;
      };
      console.log(report);
      report.forEach((orders) => {
        details.push(orders.oders);
      });
 
      res.render("admin/salesReport", { details, getDate });
      // res.render('admin/salesReport')
    } catch (error) {
      next(error);
    }
  }),
  postSalesReport: asyncHandler(async (req, res, next) => {
    try {
      let details = [];
      const getDate = (date) => {
        const oderData = new Date(date);
        const day = oderData.getDate();
        const month = oderData.getMonth() + 1;
        const year = oderData.getFullYear();

        return `${isNaN(day) ? "00" : day} - ${isNaN(month) ? "00" : month} - ${
          isNaN(year) ? "000" : year
        }`;
      };

      let oderDate = req.body;
      const start = new Date(oderDate.startdate);
      const end = new Date(oderDate.enddate);

      let report = await Oder.aggregate([
        {
          $unwind: "$oders",
        },
        {
          $match: {
            $and: [
              { "oders.oderstatus": "Delivered" },
              {
                "oders.createdAt": {
                  $gte: start,
                  $lte: new Date(end.getTime() + 86400000),
                },
              },
            ],
          },
        },
      ]);
     

      report.forEach((orders) => {
        details.push(orders.oders);
      });
      res.render("admin/salesReport", { details, getDate });
    } catch (error) {
      next(error);
    }
  }),
  dashboad: asyncHandler(async (req, res, next) => {
    try {
      let orders = await Oder.aggregate([
        { $unwind: "$oders" },
        {
          $match: {
            "oders.oderstatus": "Delivered", // Consider only completed orders
          },
        },
        {
          $group: {
            _id: null,
            totalPriceSum: { $sum: { $toInt: "$oders.totalPrice" } },
            count: { $sum: 1 },
          },
        },
      ]);
   

      let cateogorySales = await Oder.aggregate([
        { $unwind: "$oders" },
        { $unwind: "$oders.productDetails" },
        {
          $match: {
            "oders.oderstatus": "Delivered",
          },
        },
        {
          $project: {
            CategoryId: "$oders.productDetails.category",
            totalPrice: {
              $multiply: [
                { $toDouble: "$oders.productDetails.productPrice" },
                { $toDouble: "$oders.productDetails.quantity" },
              ],
            },
          },
        },
        {
          $group: {
            _id: "$CategoryId",
            PriceSum: { $sum: "$totalPrice" },
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "categoryDetails",
          },
        },
        {
          $unwind: "$categoryDetails",
        },
        {
          $project: {
            categoryName: "$categoryDetails.title",
            PriceSum: 1,
            _id: 0,
          },
        },
      ]);
  

      let salesData = await Oder.aggregate([
        { $unwind: "$oders" },
        {
          $match: {
            "oders.oderstatus": "Delivered",
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$oders.createdAt",
              },
            },
            dailySales: { $sum: { $toInt: "$oders.totalPrice" } },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]);

      let salesCount = await Oder.aggregate([
        { $unwind: "$oders" },
        {
          $match: {
            "oders.oderstatus": "Delivered",
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$oders.createdAt",
              },
            },
            orderCount: { $sum: 1 },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]);

      let categoryCount = await Category.find({}).count();
      let productsCount = await Product.find({}).count();

      let onlinePay = await Oder.aggregate([
        { $unwind: "$oders" },
        {
          $match: {
            "oders.paymentMethod": "razorpay",
            "oders.oderstatus": "Delivered",
          },
        },
        {
          $group: {
            _id: null,
            totalPriceSum: { $sum: { $toInt: "$oders.totalPrice" } },
            count: { $sum: 1 },
          },
        },
      ]);

      let walletPay = await Oder.aggregate([
        { $unwind: "$oders" },
        {
          $match: {
            "oders.paymentMethod": "Wallet",
            "oders.oderstatus": "Delivered",
          },
        },
        {
          $group: {
            _id: null,
            totalPriceSum: { $sum: { $toInt: "$oders.totalPrice" } },
            count: { $sum: 1 },
          },
        },
      ]);

      let codPay = await Oder.aggregate([
        { $unwind: "$oders" },
        {
          $match: {
            "oders.paymentMethod": "cod",
            "oders.oderstatus": "Delivered",
          },
        },
        {
          $group: {
            _id: null,
            totalPriceSum: { $sum: { $toInt: "$oders.totalPrice" } },
            count: { $sum: 1 },
          },
        },
      ]);

      let latestOders = await Oder.aggregate([
        { $unwind: "$oders" },
        {
          $sort: {
            "oders.createdAt": -1,
          },
        },
        { $limit: 10 },
      ]);
    
      console.log(cateogorySales);

      res.render("admin/admin-Home", {
        orders,
        productsCount,
        categoryCount,
        onlinePay,
        walletPay,
        codPay,
        salesData,
        order: latestOders,
        salesCount,
        walletPay,
        cateogorySales,
      });
    } catch (error) {
      next(error);
    }
  }),
};

