import { Module } from "@nestjs/common";
import { AuthGithubController } from './auth.github.controller';

@Module({
    controllers: [AuthGithubController],
})
export class AuthModule {}
