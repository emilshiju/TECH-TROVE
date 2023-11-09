import asyncHandler from "express-async-handler";
import banner from "../models/banner.js";
import mongoose from "mongoose";

export default {
  getBannerForm: asyncHandler(async (req, res) => {
    var FlashMessage = req.flash("message");
    res.render("admin/add-Banner", {
      message: FlashMessage,
    });
  }),
  addBanner: asyncHandler(async (req, res) => {
    console.log(req.body);
    console.log(
      "hfshfisdhfisdjfoijfisjfklsdjfsjfiosjfojjjjjjjjjjjjjjjjjjjjjjjjjjjj"
    );
    try {
      const { title, link } = req.body;
      console.log(title);
      const image = req.file.filename;
      console.log(image);

      console.log(link);
      let banners = new banner({
        title,
        link,
        image,
      });
      await banners.save();

      req.flash("message", "succesfuly created");
      res.redirect("/getBannerForm");
    } catch (error) {
      console.log(error);
    }
  }),
  getBannerList: asyncHandler(async (req, res) => {
    try {
      let bannerlist = await banner.find();
      var FlashMessage = req.flash("message");

      res.render("admin/banner-List", {
        bannerlist: bannerlist,
        message: FlashMessage,
      });
    } catch (error) {
      console.log(error);
    }
  }),
  geteditBanner: asyncHandler(async (req, res) => {
    try {
      const id = req.params.id;
      console.log(id);
      console.log(
        "hereeeeeeeeeeeeeeeeeeeeejjjjjjjjjjjjjjjjjjjjjjjjjjjjjjeeeeeeeeeeeeeeeeeeeeeee"
      );
      console.log(`Request from ${req.ip} to ${req.method} ${req.url}`);
      let currentBanner = await banner.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(id) },
        },
        {
          $project: {
            title: 1,
            image: 1,
            link: 1,
          },
        },
      ]);
      console.log(currentBanner);
      let image = currentBanner[0].image;

      res.render("admin/edit-banner", { currentBanner, image });
    } catch (error) {
      console.log(error);
    }
  }),
  editBanner: asyncHandler(async (req, res) => {
    try {
      let image = req.file.filename;

      let bannerupated = await banner.findByIdAndUpdate(req.body.bannerId, {
        title: req.body.title,
        link: req.body.link,
        image,
      });

      req.flash("message", "succesfuly Updated");
      res.redirect("/banner-List");
    } catch (error) {
      console.log(error);
    }
  }),
  deleteBanner: asyncHandler(async (req, res) => {
    try {
      let id = req.params.id;
      let deleteBanner = await banner.deleteOne({ _id: id });

      req.flash("message", "succesfuly Deleted");
      res.redirect("/banner-List");
    } catch (error) {
      console.log(error);
    }
  }),
};
