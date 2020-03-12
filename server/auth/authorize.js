const jwt = require("jsonwebtoken");
const {promisify} = require("util");
const ms = require("ms");

const sign = promisify(jwt.sign);

module.exports = async (db, {match, subject, email, meta, authType}) => {
    let user;

    if (match) {
        const {rows} = await db.query(/*sql*/`
            SELECT encode(token_subject, 'base64') AS token_subject FROM users WHERE id = $1;
        `, [match.user_id]);

        user = {id: match.user_id, token_subject: rows[0].token_subject, existing: true};

        if (!user.token_subject) {
            user.token_subject = (await db.query(/*sql*/`
                UPDATE users SET token_subject = gen_random_bytes($1) WHERE id = $2 RETURNING encode(token_subject, 'base64') AS token_subject;
            `, [process.env.TOKEN_SUBJECT_LENGTH || 33, user.id])).rows[0].token_subject;
        }
    } else {
        const client = await db.connect();
        try {
            await client.query("BEGIN");

            const {rows} = await client.query(/*sql*/`
                INSERT INTO users (token_subject) VALUES (gen_random_bytes($1)) RETURNING id, encode(token_subject, 'base64') AS token_subject;
            `, [process.env.TOKEN_SUBJECT_LENGTH || 32]);

            user = rows[0];

            await client.query(/*sql*/`
                INSERT INTO user_auth (user_id, auth_type, subject, email, meta) VALUES ($1, $2, $3, $4, $5);
            `, [user.id, authType, subject, email, meta]);

            await client.query("COMMIT");
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }

    return {
        token: await sign({}, process.env.JWT_SECRET, {
            subject: user.token_subject,
            notBefore: 0,
            expiresIn: process.env.JWT_EXPIRES_IN || (process.env.AUTH_TOKEN_MAX_AGE || 3600)
        }),
        existing: user.existing
    };
};