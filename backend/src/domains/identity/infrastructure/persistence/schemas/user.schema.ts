import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { DEFAULT_VISIBLE_MENUS } from '@/shared/domain/constants/user.constants';

export type UserDocument = HydratedDocument<User> & {
  id: string;
  comparePassword(plain: string): Promise<boolean>;
  omitPassword(): Record<string, unknown>;
};

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      delete ret._id;
      delete ret.password;
      return ret;
    },
  },
})
export class User {
  id: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, default: '' })
  nickName: string;

  @Prop({ type: String, default: '' })
  bio: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({ type: String, select: false })
  password: string;

  @Prop({ type: String, default: null })
  profilePicture: string;

  @Prop({ type: String, default: 'ACTIVE' })
  status: string;

  @Prop({ type: String, default: null })
  gender: string;

  @Prop({ type: String, default: null })
  maritalStatus: string;

  @Prop({ type: Date, default: null })
  birthday: Date;

  @Prop({ type: String, default: '' })
  address: string;

  @Prop({ type: String, default: '' })
  phone: string;

  @Prop({ type: [Types.ObjectId], ref: 'Role', default: [] })
  roleIds: Types.ObjectId[];

  @Prop({ default: 1, min: 1 })
  permVersion: number;

  @Prop({ default: false })
  isSuperadmin: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Department', default: null })
  departmentId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'Department', default: [] })
  departmentIds: Types.ObjectId[];

  @Prop({ type: String, default: null })
  currentTeam: string;

  @Prop({ type: Boolean, default: false })
  onBoardingCompleted: boolean;

  @Prop({ type: Date })
  lastLogin: Date;

  @Prop({ type: String })
  createdBy: string;

  @Prop({ type: String })
  updatedBy: string;

  @Prop({ type: [String], default: DEFAULT_VISIBLE_MENUS })
  visibleMenus: string[];
}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ status: 1 });
UserSchema.index({ roleIds: 1 });
UserSchema.index({ isSuperadmin: 1 });
UserSchema.index({ departmentId: 1 });
UserSchema.index({ departmentIds: 1 });

UserSchema.virtual('id').get(function (this: UserDocument) {
  return this._id?.toHexString();
});

UserSchema.pre<UserDocument>('save', function (next) {
  next();
});

UserSchema.methods.comparePassword = async function (
  this: UserDocument,
  plain: string,
): Promise<boolean> {
  return bcrypt.compare(plain, this.password);
};

UserSchema.methods.omitPassword = function (
  this: UserDocument,
): Record<string, unknown> {
  const obj = this.toObject() as unknown as Record<string, unknown>;
  delete obj.password;
  return obj;
};

export { UserSchema };
