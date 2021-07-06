import { Context, Next } from "koa";
import { Project } from "../entity/project";
import { RedisClient } from "redis";

const redisClient = new RedisClient({ url: process.env.REDIS_URL });

export const AuthorizeWithSecretKey = async (ctx: Context, next: Next) => {
    //check redis for key {key: ProjectID}
    let token = ctx.request.header.authorization;
    let secret_key = token.split(' ')[1];
    if (secret_key == null) {
        ctx.status = 400;
        ctx.body = "UnAuthorized"
        return;
    }
    // ctx.set('X-Response-Time', "k");
    await next();
}