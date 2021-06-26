import { Context } from "koa";
import { getManager, Repository, Not, Equal, Like } from "typeorm";
import { validate, ValidationError } from "class-validator";
import bcrypt from "bcrypt";
import { request, summary, path, body, responsesAll, tagsAll } from "koa-swagger-decorator";
import { User, userSchema } from "../entity/user";
import { Login } from "../interfaces/utils";
import { publify } from "../utils/publify";

let public_field = ["id", "name", "email", "isVerified"];


@responsesAll({ 200: { description: "success" }, 400: { description: "bad request" }, 401: { description: "unauthorized, missing/wrong jwt token" } })
@tagsAll(["User"])
export default class UserController {
    @request("post", "/register")
    @summary("Create a user")
    @body(userSchema)
    public static async createUser(ctx: Context): Promise<void> {
        const userToBeSaved: User = User.create({
            name: ctx.request.body.name,
            email: ctx.request.body.email,
            password: bcrypt.hashSync(ctx.request.body.password, 8),
            otp: null
        });
        // validate user entity
        const errors: ValidationError[] = await validate(userToBeSaved); // errors is an array of validation errors

        if (errors.length > 0) {
            // return BAD REQUEST status code and errors array
            ctx.status = 400;
            ctx.body = errors;
        } else if (await User.findOne({ email: userToBeSaved.email })) {
            // return BAD REQUEST status code and email already exists error
            ctx.status = 400;
            ctx.body = "The specified e-mail address already exists";
        } else {
            const user = await User.save(userToBeSaved);
            ctx.status = 201;
            ctx.body = user;

        }

    }

    @request("post", "/login")
    @summary("Login a user")
    @body(userSchema)

    public static async login(ctx: Context): Promise<void> {
        const loginData: Login = {
            email: ctx.request.body.email,
            password: ctx.request.body.password
        }

        const errors: ValidationError[] = await validate(loginData); // errors is an array of validation errors

        if (errors.length > 0) {
            ctx.status = 400;
            ctx.body = errors;
            return;
        }
        let user = await User.findOne({ email: loginData.email });
        if (!user) {
            // return BAD REQUEST status code and email already exists error
            ctx.status = 400;
            ctx.body = "The specified e-mail address does not exists";
        } else if (await bcrypt.compare(loginData.password, user.password)) {

            ctx.status = 201;
            ctx.body = await publify(user, public_field);

        }
        else {
            ctx.status = 400;
            ctx.body = "Wrong Password";
        }

    }

}
