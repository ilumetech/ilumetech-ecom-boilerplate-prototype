import {
  Controller,
  Post,
  Req,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';
import { ClerkAuthGuard } from '../common/guards';

@Controller('upload')
@UseGuards(ClerkAuthGuard)
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('image')
  async uploadImage(@Req() req: FastifyRequest) {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request is not multipart');
    }

    const data = await req.file();
    if (!data) {
      throw new BadRequestException('No file uploaded');
    }

    const buffer = await data.toBuffer();

    try {
      const result = await this.cloudinaryService.uploadFile(buffer);
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }
}
