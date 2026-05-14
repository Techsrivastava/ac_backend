import mongoose, { Document, Schema } from 'mongoose';

export interface IPincode extends Document {
  pincode: string;
  city: string;
  state: string;
  available: boolean;
  deliveryDays: number;
  createdAt: Date;
  updatedAt: Date;
}

const pincodeSchema = new Schema<IPincode>({
  pincode: { type: String, required: true, unique: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  available: { type: Boolean, default: true },
  deliveryDays: { type: Number, default: 5 }
}, {
  timestamps: true
});

export default mongoose.model<IPincode>('Pincode', pincodeSchema);
