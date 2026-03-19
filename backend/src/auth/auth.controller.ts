import { Controller, Post, Body, Get, HttpCode, HttpStatus, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './google-auth.guard';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    async register(@Body() body: any) {
        return this.authService.register(body.email, body.password, body.fullName, body.phoneNumber);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() body: any) {
        return this.authService.login(body.email, body.password);
    }

    @Get('google')
    @UseGuards(GoogleAuthGuard)
    async googleAuth() {
        // Guard will redirect to Google
    }

    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
        const result = await this.authService.googleLogin(req.user);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const params = new URLSearchParams({
            token: result.access_token,
            userId: result.user.id,
            email: result.user.email,
        });
        res.redirect(`${frontendUrl}/auth/google/callback?${params.toString()}`);
    }
}
