import { Context, Next } from "koa";
import { Project } from "../entity/project";
import { RedisClient } from "redis";

const redisClient = new RedisClient({ url: process.env.REDIS_URL });

redisClient.on("error", function (error) {
    console.error(error);
});

export const AuthorizeWithSecretKey = async (ctx: Context, next: Next) => {
    //check redis for key {key: ProjectID}
    let token = ctx.request.header.authorization;
    let secret_key = token.split(' ')[1];
    if (secret_key == null) {
        ctx.status = 400;
        ctx.body = "UnAuthorized"
        return;
    }
    redisClient.get(secret_key, async (err, data) => {
        if (err) {
            ctx.status = 500;
            ctx.body = err;
            console.log(err);
            return;
        }
        if (data != null) {
            console.log('we Found it in Redis 🟢 ', data);
            ctx.state.cached_data = data;

        } else {
            console.log('Not Found 🔴 ');
            ctx.state.cached_data = null;
            //fetch user from db and put on redis

        }
        await next();
    })


}