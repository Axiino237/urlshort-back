import { 
  Controller, Post, Get, Delete, Param, Body, UseGuards, 
  Req, Res, HttpCode, HttpStatus 
} from '@nestjs/common';
import { Request, Response } from 'express';
import { UrlsService } from './urls.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  // 1. Create short URL (Protected)
  @UseGuards(JwtAuthGuard)
  @Post('api/urls')
  async create(
    @Req() req: any, 
    @Body('originalUrl') originalUrl: string,
    @Body('customAlias') customAlias?: string
  ) {
    return this.urlsService.create(req.user.id, originalUrl, customAlias);
  }

  // 2. List own URLs (Protected)
  @UseGuards(JwtAuthGuard)
  @Get('api/urls')
  async findAll(@Req() req: any) {
    return this.urlsService.findAllByUser(req.user.id);
  }

  // 3. Delete short URL (Protected)
  @UseGuards(JwtAuthGuard)
  @Delete('api/urls/:id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.urlsService.remove(req.user.id, id);
  }

  // 4. Core redirection gateway (/s/:code)
  @Get('s/:code')
  async redirectGateway(
    @Param('code') code: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const match = await this.urlsService.findByCode(code);
      
      // Analyze request headers
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || '';

      // Direct visitor to the React frontend 3-step high revenue ad platform
      const redirectUrl = `http://localhost:5173/ad/step1?code=${match.shortCode}`;
      return res.redirect(redirectUrl);
    } catch (err) {
      // Fallback redirect to public landing on code error
      return res.redirect('http://localhost:5173/?error=invalid-link');
    }
  }
}
