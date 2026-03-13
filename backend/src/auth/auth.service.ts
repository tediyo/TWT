import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async register(email: string, pass: string) {
        const existingUser = await this.usersService.findOneByEmail(email);
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }
        const hashedPassword = await bcrypt.hash(pass, 10);
        const user = await this.usersService.create({
            email,
            password: hashedPassword,
        });
        return {
            id: user._id.toString(),
            email: user.email,
            createdAt: (user as any).createdAt,
        };
    }

    async login(email: string, pass: string) {
        const user = await this.usersService.findOneByEmail(email);
        if (user && (await bcrypt.compare(pass, user.password))) {
            const payload = { email: user.email, sub: user._id.toString() };
            return {
                access_token: this.jwtService.sign(payload),
                user: {
                    id: user._id.toString(),
                    email: user.email,
                },
            };
        }
        throw new UnauthorizedException('Invalid credentials');
    }
}
