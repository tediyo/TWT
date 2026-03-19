import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { LocatorService } from './locator.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('locator')
export class LocatorController {
    constructor(private locatorService: LocatorService) { }

    @UseGuards(OptionalJwtAuthGuard)
    @Post('generate')
    async generate(@Body() body: any, @Request() req: any) {
        return this.locatorService.generateLocators(body.url, body.keyword, body.locatorType, req.user?.userId, body.cookies, body.authToken, body.siteUsername, body.sitePassword);
    }

    @UseGuards(OptionalJwtAuthGuard)
    @Post('debug')
    async debug(@Body() body: any) {
        return this.locatorService.debugPage(body.url);
    }

    @UseGuards(JwtAuthGuard)
    @Get('history')
    async history(@Request() req: any) {
        return this.locatorService.getHistory(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('history')
    async clearHistory(@Request() req: any) {
        return this.locatorService.clearHistory(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('history/:id')
    async deleteHistory(@Param('id') id: string, @Request() req: any) {
        return this.locatorService.deleteHistory(id, req.user.userId);
    }
}
