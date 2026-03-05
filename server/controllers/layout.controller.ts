import { Response, Request, NextFunction } from "express";
import ErrorHadler from "../utils/ErrorHandler";
import { CatchAsyncErrorHandler } from "../middleware/catchAsyncErrors";
import cloudinary from "cloudinary";
import LayoutModel from "../models/layout.model";

export const createLayout = CatchAsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = req.body?.type;
      if (!type) return next(new ErrorHadler("Type is required", 400));

      if (type === "Banner") {
        const { image, title, subTitle } = req.body;
        const myCloud = await cloudinary.v2.uploader.upload(image, {
          folder: "layout",
        });

        await LayoutModel.create({
          type: "Banner",
          bannerImages: {
            image: { public_id: myCloud.public_id, url: myCloud.secure_url },
            title,
            subtitle: subTitle,
          },
        });
      } else if (type === "FAQ") {
        const { faq } = req.body;
        if (!faq || !Array.isArray(faq))
          return next(new ErrorHadler("FAQ array is required", 400));

        const faqItems = faq.map((item: any) => ({
          question: item.question,
          answer: item.answer,
        }));
        const faqDoc = await LayoutModel.findOne({ type: "FAQ" });

        if (faqDoc) {
          await LayoutModel.findByIdAndUpdate(faqDoc._id, {
            type: "FAQ",
            faq: faqItems,
          });
        } else {
          await LayoutModel.create({ type: "FAQ", faq: faqItems });
        }
      } else if (type === "Category") {
        const { categories } = req.body;

        if (!categories || !Array.isArray(categories)) {
          return next(new ErrorHadler("Categories array is required", 400));
        }

        const categoryItems = categories.map((item: any) => ({
          title: item.title,
        }));

        const categoryDoc = await LayoutModel.findOne({ type: "Category" });

        if (categoryDoc) {
          await LayoutModel.findByIdAndUpdate(
            categoryDoc._id,
            { categories: categoryItems },
            { new: true },
          );
        } else {
          await LayoutModel.create({
            type: "Category",
            categories: categoryItems,
          });
        }
      }

      res
        .status(201)
        .json({ success: true, message: "Layout created successfully" });
    } catch (error: any) {
      return next(new ErrorHadler(error.message, 500));
    }
  },
);


// edit layout
export const editLayout = CatchAsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;

      if (!type) {
        return next(new ErrorHadler("Type is required", 400));
      }

      // =========== BANNER =================
      if (type === "Banner") {
        const bannerData = await LayoutModel.findOne({ type: "Banner" });

        if (!bannerData) {
          return next(new ErrorHadler("Banner not found", 404));
        }

        const { image, title, subTitle } = req.body;

        // Delete old image
        if (bannerData.bannerImages?.image?.public_id) {
          await cloudinary.v2.uploader.destroy(
            bannerData.bannerImages.image.public_id,
          );
        }

        const myCloud = await cloudinary.v2.uploader.upload(image, {
          folder: "layout",
        });

        await LayoutModel.findByIdAndUpdate(
          bannerData._id,
          {
            bannerImages: {
              image: {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
              },
              title,
              subtitle: subTitle,
            },
          },
          { new: true },
        );

        // ============FAQ =================
      } else if (type === "FAQ") {
        const { layoutId, faqItem } = req.body;

        const faqItems = faqItem.map((item: any) => ({
          question: item.question,
          answer: item.answer,
        }));

        await LayoutModel.findByIdAndUpdate(
          layoutId,
          { faq: faqItems },
          { new: true },
        );

        // ============ CATEGORY =================
      } else if (type === "Category") {
        const { layoutId, categoriesItems } = req.body;

        if (!layoutId || !categoriesItems) {
          return next(new ErrorHadler("Missing required fields", 400));
        }

        const categories = categoriesItems.map((item: any) => ({
          title: item.title,
        }));

        const updated = await LayoutModel.findByIdAndUpdate(
          layoutId,
          { categories },
          { new: true },
        );

        if (!updated) {
          return next(new ErrorHadler("Layout not found", 404));
        }
      }

      res.status(200).json({
        success: true,
        message: "Layout updated successfully",
      });
    } catch (error: any) {
      return next(new ErrorHadler(error.message, 500));
    }
  },
);

// get layout by type
export const getLayoutByType = CatchAsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req.body;

        if (!type) {
            return next(new ErrorHadler("Type is required", 400));
        }
        const layout = await LayoutModel.findOne({ type });

        if (!layout) {
            return next(new ErrorHadler("Layout not found", 404));
        }

        res.status(200).json({
            success: true,
            layout,
        });
    } catch (error: any) {
      return next(new ErrorHadler(error.message, 500));
    }
  },
);