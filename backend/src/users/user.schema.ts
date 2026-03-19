import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true })
    fullName: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: false })
    phoneNumber: string;

    @Prop({ required: false })
    password: string;

    @Prop({ required: false })
    googleId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
