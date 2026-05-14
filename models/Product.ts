import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  brand: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: mongoose.Types.ObjectId;
  images: string[];
  stock: number;
  featured: boolean;
  coolingCapacity: string; // e.g., "12000 BTU", "18000 BTU"
  energyRating: number; // 1-5 stars
  warranty: string; // e.g., "1 Year", "2 Years"
  installationCharges: number;
  type: 'split' | 'window' | 'inverter' | 'portable' | 'commercial' | 'accessories';
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  discountPrice: { type: Number },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  images: [{ type: String, required: true }],
  stock: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  coolingCapacity: { type: String, required: true },
  energyRating: { type: Number, min: 1, max: 5, required: true },
  warranty: { type: String, required: true },
  installationCharges: { type: Number, default: 0 },
  type: { 
    type: String, 
    enum: ['split', 'window', 'inverter', 'portable', 'commercial', 'accessories'],
    required: true 
  }
}, {
  timestamps: true
});

export default mongoose.model<IProduct>('Product', productSchema);
