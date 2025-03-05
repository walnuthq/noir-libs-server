import { Controller, Get, Inject } from '@nestjs/common';
import { AuthenticatedUser } from '../../common/user-session.decorator';
import { UserSession } from '../../common/user-session';
import { PackageDto } from '../../dto/packages/package.dto';
import { AllPackagesService } from '../all/all-packages.service';

@Controller('api/v1/packages/user')
export class UserPackagesController {

    constructor(@Inject() private allPackagesService: AllPackagesService) {}

    @Get()
    async getAllUserPackages(@AuthenticatedUser() authenticatedUser: UserSession): Promise<PackageDto[]> {
        return this.allPackagesService.getAllUserPackages(authenticatedUser.userId);
    }
}
