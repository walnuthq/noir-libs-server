import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PackagesModule } from './packages/packages.module';
import MikroOrmConfig from './mikro-orm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async () => MikroOrmConfig,
      inject: [ConfigService],
    }),
    PackagesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}