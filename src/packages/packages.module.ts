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
import { UserModule } from '../user/user.module';
import { AllPackagesService } from './all/all-packages.service';
import { UserPackagesController } from './user/user-packages.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([Package, Version, Download]),
    UserModule
  ],
  controllers: [AllPackagesController, PackageController, PackageVersionController, UserPackagesController],
  providers: [PackageService, AllPackagesService, ExtractService, ManifestService]

})
export class PackagesModule {}