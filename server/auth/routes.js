const Router = require("@koa/router");
const ms = require("ms");
const providers = require("./providers");
const authorize = require("./authorize");

module.exports = (db, prefix) => {
    const router = new Router();
    
    router.get("/signin", async ctx => {
        if (providers[ctx.query.provider]) {
            const provider = providers[ctx.query.provider](db);
            const url = await provider.getAuthorizeUrl(ctx, {prefix});
            if (url) {
                ctx.redirect(url);
            }
        } else {
            ctx.status = 400;
            ctx.body = "Bad Auth Provider";
        }
    });

    router.get("/callback/:provider", async ctx => {
        if (providers[ctx.params.provider]) {
            const provider = providers[ctx.params.provider](db);
            const data = await provider.handleCallback(ctx, {prefix});
            if (data) {
                const {token} = await authorize(db, data);
                if (token) {
                    ctx.cookies.set("auth", token, {
                        maxAge: process.env.AUTH_TOKEN_MAX_AGE ? ms(process.env.AUTH_TOKEN_MAX_AGE) : 3600000,
                        httpOnly: false,
                        secure: !!process.env.AUTH_TOKEN_SECURE
                    });
                    ctx.body = "Done";
                }
            }
        } else {
            ctx.status = 400;
            ctx.body = "Bad Auth Provider";
        }
    });

    return prefix ? router.prefix(prefix) : router;
};