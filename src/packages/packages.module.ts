import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PackagesController } from './packages.controller';
import { Package } from '../model/package.entity';
import { Version } from '../model/version.entity';
import { Download } from '../model/download.entity';
import { PackageService } from './package.service';
import { ExtractService } from './extract.service';
import { ManifestService } from './manifest.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([Package, Version, Download])
  ],
  controllers: [PackagesController],
  providers: [PackageService, ExtractService, ManifestService]
})
export class PackagesModule {}