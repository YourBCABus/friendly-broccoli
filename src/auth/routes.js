const Router = require("@koa/router");
const providers = require("./providers");

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
            await provider.handleCallback(ctx, {prefix});
        } else {
            ctx.status = 400;
            ctx.body = "Bad Auth Provider";
        }
    });

    return prefix ? router.prefix(prefix) : router;
};