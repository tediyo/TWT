import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name)
        private userModel: Model<UserDocument>,
    ) { }

    async findOneByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async create(userData: Partial<User>): Promise<UserDocument> {
        const user = new this.userModel(userData);
        return user.save();
    }

    async findOneById(id: string): Promise<UserDocument | null> {
        return this.userModel.findById(id).exec();
    }

    async findOneByGoogleId(googleId: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ googleId }).exec();
    }

    async findOrCreateGoogleUser(profile: { email: string; googleId: string; fullName: string }): Promise<UserDocument> {
        // Check if user exists by googleId
        let user = await this.findOneByGoogleId(profile.googleId);
        if (user) return user;

        // Check if user exists by email (link Google to existing account)
        user = await this.findOneByEmail(profile.email);
        if (user) {
            user.googleId = profile.googleId;
            return user.save();
        }

        // Create new Google user (no password)
        return this.create({
            fullName: profile.fullName,
            email: profile.email,
            googleId: profile.googleId,
        });
    }
}
