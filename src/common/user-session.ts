export class UserSession {
    name: string;
    userId: string;
    avatarUrl?: string;

    constructor(name: string, userId: string, avatarUrl?: string,) {
        this.name = name;
        this.userId = userId;
        this.avatarUrl = avatarUrl;
    }
}