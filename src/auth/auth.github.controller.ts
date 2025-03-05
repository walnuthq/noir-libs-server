import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Logger,
    Post,
    Req,
    Res,
    UnauthorizedException
} from "@nestjs/common";
import { AuthenticatedUser } from '../common/user-session.decorator';
import { UserSession } from '../common/user-session';

@Controller("/api/v1/auth")
export class AuthGithubController {
    private readonly logger = new Logger(AuthGithubController.name, { timestamp: true });

    @Post("callback")
    async githubAuthCallback(@Body() body, @Req() req: Request) {
        const { code } = body;

        if (!code) {
            throw new BadRequestException("Missing code parameter");
        }

        const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code: code,
            }),
        });

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
            throw new UnauthorizedException("Invalid GitHub authorization code");
        }

        const userResponse = await fetch("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${ accessToken }` },
        });

        // @ts-ignore
        req.session.user = await userResponse.json();
        // @ts-ignore
        await req.session.save();
    }

    @Get("github")
    async githubLogin(@Res() res) {
        const clientId = process.env.GITHUB_CLIENT_ID;
        const redirectUri = encodeURIComponent(process.env.GITHUB_CALLBACK_URL);
        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
        res.redirect(githubAuthUrl);
    }

    @Get("logout")
    async logout(@Req() req, @AuthenticatedUser() user: UserSession) {
        this.logger.log(`User ${user.userId} signs out!`);
        await req.session.destroy();
    }
}
