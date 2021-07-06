import Router from "@koa/router";
import { AuthorizeWithSecretKey } from "src/middlewares/auth";
import { project, general } from "../controller";

const otpRoute = new Router({
    prefix: "/otp"
});

otpRoute.use(AuthorizeWithSecretKey)
otpRoute.get("/test", general.helloWorld);


/**
 * ToDo
 * Generate an OTP (URL and Number)
 * Verify an OTP
 * Query OTPs
 */


export { otpRoute };