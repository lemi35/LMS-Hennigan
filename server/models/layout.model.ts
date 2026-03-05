require('dotenv').config();
import mongoose, {Document, Model, Schema} from "mongoose";

interface FaqItem extends Document {
    question: string;
    answer: string;
}

interface Category extends Document {
    title: string;
}

interface BannerImage extends Document {
    public_id: string;
    url: string;
}

interface Layout extends Document {
    type: string;
    faq: FaqItem[];
    categories: Category[];
    bannerImages: {
        image: BannerImage;
        title: string;
        subtitle: string;
    };
}

const faqSchema = new Schema<FaqItem>({
    question: {
        type: String,
    },
    answer: {
        type: String,
    },
});

const categorySchema = new Schema<Category>({
    title: {
        type: String,
    },
});

const bannerImageSchema = new Schema<BannerImage>({
    public_id: {
        type: String,
    },
    url: {
        type: String,
    },
});

const layoutSchema = new Schema<Layout>({
    type: {type: String},
    faq: [faqSchema],
    categories: [categorySchema],
    bannerImages: {
        image: bannerImageSchema,
        title: String,
        subtitle: String,
    },
})

const LayoutModel: Model<Layout> = mongoose.model<Layout>("Layout", layoutSchema);

export default LayoutModel;