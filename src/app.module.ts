import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PackagesModule } from './packages/packages.module';
import MikroOrmConfig from './mikro-orm.config';
import { AztecPackagesInitService } from './services/aztec-packages-init.service';

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
  providers: [AztecPackagesInitService],
})
export class AppModule {}