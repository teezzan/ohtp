import Router from "@koa/router";
import { AuthorizeWithSecretKey } from "../middlewares/auth";
import { project, general } from "../controller";

const otpRoute = new Router({
    prefix: "/otp"
});

otpRoute.get("/verify/:token", project.verifyEmailOTP);

otpRoute.use(AuthorizeWithSecretKey)
otpRoute.post("/email", project.generateEmailOTP);
otpRoute.post("/sms", project.generateSMSOTP);

/**
 * ToDo
 * Generate an OTP (URL and Number)
 * Verify an OTP
 * Query OTPs
 */


export { otpRoute };