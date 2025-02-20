import { Global, Module } from "@nestjs/common";
import { UserController } from './user.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ApiKey } from '../model/auth/apikey.entity';
import { ApiKeyService } from './apikey.service';

@Global()
@Module({
    imports: [MikroOrmModule.forFeature([ApiKey])],
    providers: [ApiKeyService],
    controllers: [UserController],
    exports: [ApiKeyService]
})
export class UserModule {}
