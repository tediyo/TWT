import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { LocatorService } from './locator.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('locator')
export class LocatorController {
    constructor(private locatorService: LocatorService) { }

    @UseGuards(JwtAuthGuard)
    @Post('generate')
    async generate(@Body() body: any, @Request() req: any) {
        return this.locatorService.generateLocators(body.url, body.keyword, body.locatorType, req.user.userId, body.cookies);
    }

    @UseGuards(JwtAuthGuard)
    @Post('debug')
    async debug(@Body() body: any) {
        return this.locatorService.debugPage(body.url);
    }

    @UseGuards(JwtAuthGuard)
    @Get('history')
    async history(@Request() req: any) {
        return this.locatorService.getHistory(req.user.userId);
    }
}
