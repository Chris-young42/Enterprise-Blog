import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import appConfig from './config/app.config';
import { HealthModule } from './modules/health/health.module';
import { SystemModule } from './modules/system/system.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TrafficShieldGuard } from './common/guards/traffic-shield.guard';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TagsModule } from './modules/tags/tags.module';
import { SeriesModule } from './modules/series/series.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { CommentsModule } from './modules/comments/comments.module';
import { MediaModule } from './modules/media/media.module';
import { PagesModule } from './modules/pages/pages.module';
import { MessageBoardModule } from './modules/message-board/message-board.module';
import { FriendLinksModule } from './modules/friend-links/friend-links.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { SiteConfigsModule } from './modules/site-configs/site-configs.module';
import { MomentsModule } from './modules/moments/moments.module';
import { StatsModule } from './modules/stats/stats.module';
import { SensitiveWordsModule } from './modules/sensitive-words/sensitive-words.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OpsModule } from './modules/ops/ops.module';
import { SecurityModule } from './modules/security/security.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    PrismaModule,
    HealthModule,
    SystemModule,
    AuthModule,
    UsersModule,
    RolesModule,
    CategoriesModule,
    TagsModule,
    SeriesModule,
    ArticlesModule,
    CommentsModule,
    MediaModule,
    PagesModule,
    MessageBoardModule,
    FriendLinksModule,
    AnnouncementsModule,
    SiteConfigsModule,
    MomentsModule,
    StatsModule,
    SensitiveWordsModule,
    NotificationsModule,
    OpsModule,
    SecurityModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TrafficShieldGuard,
    },
  ],
})
export class AppModule {}
