import mongoose, { Document, Schema } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  views: number;
  featured: boolean;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  excerpt: { type: String, required: true, maxlength: 300 },
  content: { type: String, required: true },
  image: { type: String, required: true },
  author: { type: String, required: true, default: 'Be Cool Team' },
  category: { type: String, required: true },
  tags: [{ type: String }],
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  views: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  metaTitle: { type: String },
  metaDescription: { type: String }
}, {
  timestamps: true
});

// Index for search
blogSchema.index({ title: 'text', content: 'text', tags: 'text' });

export default mongoose.model<IBlog>('Blog', blogSchema);
