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
                scope: [
                    "https://www.googleapis.com/auth/userinfo.profile",
                    "https://www.googleapis.com/auth/userinfo.email"
                ],
                state
            });
        },
        async handleCallback(ctx, {prefix}) {
            const authType = "google";

            if (!ctx.query.code) {
                ctx.status = 400;
                ctx.body = "Missing Code";
                return;
            }

            const client = makeClient(ctx, prefix);

            let payload;
            try {
                const {tokens: {id_token}} = await client.getToken(ctx.query.code);
                payload = (await client.verifyIdToken({idToken: id_token})).payload;
                if (!payload || !payload.sub) {
                    ctx.status = 502;
                    ctx.body = "Upstream Error (ID Token)";
                }
            } catch (e) {
                if (e.code === "400") {
                    ctx.status = 400;
                    ctx.body = "Bad Code";
                } else {
                    console.log(e);
                    ctx.status = 502;
                    ctx.body = "Upstream Error";
                }
                return;
            }

            const {rows} = await db.query(/*sql*/`
                SELECT id, user_id FROM user_auth WHERE auth_type = $1 AND subject = $2
            `, [authType, payload.sub]);

            if (rows.length > 1) {
                throw new Error("Multiple matches for subject");
            }

            let match;
            if (rows.length === 1) {
                match = rows[0];
            }

            return {match, subject: payload.sub, email: payload.email, meta: {name: payload.name}, authType};
        }
    };
}

module.exports = {google};