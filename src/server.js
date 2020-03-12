require("dotenv").config();

const fs = require("fs");
const path = require("path");
const Koa = require("koa");
const { ApolloServer, gql } = require("apollo-server-koa");
const { Pool } = require("pg");
const resolvers = require("./resolvers");
const authRoutes = require("./auth/routes");
const next = require("next");

const typedefs = fs.readFileSync(path.join(__dirname, "types.graphql"), "utf8");

const port = process.env.PORT || 3000;

const db = new Pool({
    connectionString: process.env.DATABASE_URL
});

const app = new Koa();

const server = new ApolloServer({typeDefs: gql(typedefs), resolvers: resolvers(db), graphqlPath: "/api"});
server.applyMiddleware({app, path: "/api"});

const authRouter = authRoutes(db, "/api/auth");
app.use(authRouter.routes());
app.use(authRouter.allowedMethods());

const nextApp = next({dev: process.env.NODE_ENV !== "production"});
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
    app.use(ctx => handle(ctx.req, ctx.res));
    app.listen({port}, () => {
        console.log(`Server ready: https://localhost:${port}`);
    });
});