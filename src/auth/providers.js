const GoogleAuth = require("google-auth-library");

function google(db) {
    const makeClient = (ctx, prefix) => {
        return new GoogleAuth.OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
    };

    return {
        providerEnabled: true,
        getAuthorizeUrl(ctx, {prefix, state}) {
            return makeClient(ctx, prefix).generateAuthUrl({
                access_type: "offline",
                scope: "https://www.googleapis.com/auth/userinfo.profile",
                state
            });
        },
        handleCallback(ctx, {state}) {
            ctx.body = "Auth flow done";
        }
    };
}

module.exports = {google}