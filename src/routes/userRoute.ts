import { user } from "../controller";
import jwt from "koa-jwt";
import Router from "@koa/router";

const userRoute = new Router({
    prefix: "/users"
});
userRoute.post("/register", user.createUser);
userRoute.post("/login", user.login);
userRoute.post("/forgetpassword", user.forgetPassword);
userRoute.post("/verifytoken", user.verifyforgetPasswordToken);
userRoute.post("/resetpassword", user.changePasswordwithToken);
userRoute.post("/verify", user.verifyAccount);

userRoute.use(jwt({ secret: process.env.JWT_SECRET }));
userRoute.get("/me", user.getMe);
userRoute.post("/me", user.editUser);



export { userRoute };