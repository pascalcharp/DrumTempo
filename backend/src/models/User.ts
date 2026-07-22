import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import { UserConfig } from '../config/UserConfig';
import { AuthConfig } from '../config/AuthConfig';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: UserConfig.EMAIL_MAX_LENGTH,
    match: UserConfig.EMAIL_REGEX,
  },
  passwordHash: {
    type: String,
    required: true,
    select: false, // ne jamais renvoyer ce champ dans les requêtes par défaut
  },
});


UserSchema.pre('save', async function (next) {
  try {
    if (this.isModified('passwordHash')) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, AuthConfig.BCRYPT_SALT_ROUNDS) ;
    }
    next() ;
  }
  catch (error) {
    next(error as Error)
  }
});


UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {

    return await bcrypt.compare(candidate, this.passwordHash) ;

};

export const User = mongoose.model<IUser>('User', UserSchema);