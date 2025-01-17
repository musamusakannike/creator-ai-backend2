import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  googleId: string;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  googleId: { type: String, required: true },
});

export default mongoose.model<IUser>('User', UserSchema);
