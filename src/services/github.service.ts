export const getGitHubUsername = async (userId: string): Promise<string> =>{
    const response = await fetch(`https://api.github.com/user/${userId}`, {
        headers: {
            Authorization: `token ${process.env.GITHUB_ACCESS_TOKEN}`,
            Accept: "application/vnd.github.v3+json"
        }
    });

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} - ${await response.text()}`);
    }

    const userData = await response.json();
    return userData.login;
}