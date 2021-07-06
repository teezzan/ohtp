import Router from "@koa/router";
import jwt from "koa-jwt";
import { project } from "../controller";

const otpRoute = new Router({
    prefix: "/otp"
});
otpRoute.use(jwt({ secret: process.env.JWT_SECRET }));




export { otpRoute };