import { Context, Next } from "koa";
import { project } from "../controller";
import { RedisClient } from "redis";
import { promisify } from 'util';

let redisClient = new RedisClient({ url: process.env.REDIS_URL });

redisClient.on("error", function (error) {
    console.error(error);
});


export const AuthorizeWithSecretKey = async (ctx: Context, next: Next) => {
    let token = ctx.request.header.authorization;
    let secret_key = token.split(' ')[1];
    if (secret_key == null) {
        ctx.status = 400;
        ctx.body = "UnAuthorized"
        return;
    }
    const getAsync = promisify(redisClient.get).bind(redisClient);
    const setAsync = promisify(redisClient.set).bind(redisClient);

    let data = null;
    try {
        data = await getAsync(secret_key);

    }
    catch (err) {
        throw err;
    }

    if (data != null) {
        ctx.state.cached_data = JSON.parse(data);
    } else {
        ctx.state.cached_data = null;
        let newdata = await project.getProjectBySecretKey(secret_key);
        if (newdata == null) {
            ctx.status = 500;
            ctx.body = "Project does not exist";
            return;
        }
        setAsync(secret_key, JSON.stringify(newdata)).then((x: any) => {
            console.log("Added");
        }).catch((err: any) => {
            console.log(err);
        })
        ctx.state.cached_data = newdata;

    }
    await next();
}