import { BaseContext, Context } from "koa";
import { description, request, security, summary, tagsAll } from "koa-swagger-decorator";

@tagsAll(["General"])
export default class GeneralController {

    @request("get", "/otp/test")
    @summary("Welcome page")
    @description("A simple test message to verify the service is up and running.")
    @security([{ Bearer: [] }])
    public static async helloWorld(ctx: Context): Promise<void> {
        ctx.body = ctx.state.user.id;
    }

}