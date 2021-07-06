import Koa from "koa";
import jwt from "koa-jwt";
import bodyParser from "koa-bodyparser";
import helmet from "koa-helmet";
import cors from "@koa/cors";
import winston from "winston";
import { createConnection, ConnectionOptions } from "typeorm";
import "reflect-metadata";

import { SwaggerRouter } from "koa-swagger-decorator";
import { logger } from "./utils/logger";
import { config } from "./utils/config";
import { userRoute } from "./routes/userRoute";
import { cron } from "./utils/cron";
import { projectRoute } from "./routes/projectRoutes";
import { otpRoute } from "./routes/otpRoutes";

const connectionOptions: ConnectionOptions = {
    type: "postgres",
    url: config.databaseUrl,
    synchronize: true,
    logging: false,
    entities: config.dbEntitiesPath,
    ssl: config.dbsslconn, // if not development, will use SSL
    extra: {}
};
if (connectionOptions.ssl) {
    connectionOptions.extra.ssl = {
        rejectUnauthorized: false // Heroku uses self signed certificates
    };
}

// create connection with database
// note that its not active database connection
// TypeORM creates you connection pull to uses connections from pull on your requests
createConnection(connectionOptions).then(async () => {

    const app = new Koa();

    // Provides important security headers to make your app more secure
    app.use(helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com", "fonts.googleapis.com"],
            fontSrc: ["'self'", "fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "online.swagger.io", "validator.swagger.io"]
        }
    }));

    // Enable cors with default options
    app.use(cors());

    // Logger middleware -> use winston as logger (logging.ts with config)
    app.use(logger(winston));

    // Enable bodyParser with default options
    app.use(bodyParser());
    // app.use(jwt({ secret: config.jwtSecret }).unless({ path: [/^\/swagger-/] }));




    // these routes are NOT protected by the JWT middleware, also include middleware to respond with "Method Not Allowed - 405".

    // JWT middleware -> below this line routes are only reached if JWT token is valid, secret as env variable
    // do not protect swagger-json and swagger-html endpoints

    // These routes are protected by the JWT middleware, also include middleware to respond with "Method Not Allowed - 405".
    app.use(userRoute.routes()).use(userRoute.allowedMethods());
    app.use(projectRoute.routes()).use(projectRoute.allowedMethods());
    app.use(otpRoute.routes()).use(otpRoute.allowedMethods());


    // Register cron job to do any action needed
    cron.start();


    const swaggerRoute = new SwaggerRouter({
        // prefix: "/api"
    });
    // Swagger endpoint
    swaggerRoute.swagger({
        title: "ohtp",
        description: "Ohtp is a secured otp service.",
        version: "1.0.0",
        swaggerOptions: {
            securityDefinitions: {
                Bearer: {
                    type: "apiKey",
                    in: "header",
                    name: "Authorization",
                },
            },
        },
    });
    // const dirPath = path.join(__dirname, "../");
    swaggerRoute.mapDir(__dirname);
    app.use(swaggerRoute.routes()).use(swaggerRoute.allowedMethods());


    app.listen(config.port, () => {
        console.log(`Server running on port ${config.port}`);
    });

}).catch((error: string) => console.log("TypeORM connection error: ", error));