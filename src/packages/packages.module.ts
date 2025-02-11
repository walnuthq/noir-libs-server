import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AllPackagesController } from './all/all-packages.controller';
import { Package } from '../model/package.entity';
import { Version } from '../model/version.entity';
import { Download } from '../model/download.entity';
import { PackageService } from './package.service';
import { ExtractService } from './extract.service';
import { ManifestService } from './manifest.service';
import { PackageController } from './single/package.controller';
import { PackageVersionController } from './single/package.version.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([Package, Version, Download])
  ],
  controllers: [AllPackagesController, PackageController, PackageVersionController],
  providers: [PackageService, ExtractService, ManifestService]
})
export class PackagesModule {}