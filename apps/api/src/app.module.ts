import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuditInterceptor, SensitiveFieldsInterceptor } from './common/interceptors';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { AuthModule } from './auth/auth.module';
import { WebhookModule } from './webhook/webhook.module';
import { ProductCategoryModule } from './product-category/product-category.module';
import { ProductModule } from './product/product.module';
import { UnitModule } from './unit/unit.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ColorModule } from './color/color.module';
import { UploadModule } from './upload/upload.module';


@Module({
  imports: [
    PrismaModule,
    UserModule,
    RoleModule,
    AuthModule,
    WebhookModule,
    ProductCategoryModule,
    ProductModule,
    UnitModule,
    AuditLogModule,
    DashboardModule,
    ColorModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SensitiveFieldsInterceptor,
    },
  ],
})
export class AppModule {}
