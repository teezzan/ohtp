import Router from "@koa/router";
import { AuthorizeWithSecretKey } from "../middlewares/auth";
import { project, general } from "../controller";

const otpRoute = new Router({
    prefix: "/otp"
});

otpRoute.post("/verify/:token", project.verifyAccount);

otpRoute.use(AuthorizeWithSecretKey)
otpRoute.post("/email", project.generateEmailOTP);

/**
 * ToDo
 * Generate an OTP (URL and Number)
 * Verify an OTP
 * Query OTPs
 */


export { otpRoute };