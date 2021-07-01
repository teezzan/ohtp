import { Context } from "koa";
import JsonWebToken from "jsonwebtoken";
import { validate, ValidationError } from "class-validator";
import bcrypt from "bcrypt";
import { request, summary, path, body, responsesAll, tagsAll, security } from "koa-swagger-decorator";
import { User, userSchema } from "../entity/user";
import { editSchema, EditUser, Login, loginSchema } from "../interfaces/utils";
import { publify } from "../utils/publify";

const public_field = ["id", "name", "email", "isVerified", "token"];


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
            password: ctx.request.body.password,
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
            userToBeSaved.password = bcrypt.hashSync(ctx.request.body.password, 8);
            const user = await User.save(userToBeSaved);
            ctx.status = 201;
            ctx.body = await publify(user, public_field);

        }

    }

    @request("post", "/login")
    @summary("Login a user")
    @body(loginSchema)

    public static async login(ctx: Context): Promise<void> {
        const loginData: Login = {
            email: ctx.request.body.email,
            password: ctx.request.body.password
        };

        const errors: ValidationError[] = await validate(loginData); // errors is an array of validation errors

        if (errors.length > 0) {
            ctx.status = 400;
            ctx.body = errors;
            return;
        }
        const user = await User.findOne({ email: loginData.email });
        if (!user) {
            // return BAD REQUEST status code and email already exists error
            ctx.status = 400;
            ctx.body = "The specified e-mail address does not exists";
        } else if (await bcrypt.compare(loginData.password, user.password)) {

            const token = JsonWebToken.sign({
                id: user.id,
                email: user.email
            }, process.env.JWT_SECRET);
            ctx.status = 201;
            ctx.body = await publify({ ...user, token }, public_field);


        }
        else {
            ctx.status = 400;
            ctx.body = "Wrong Password";
        }

    }

    @request("get", "/me")
    @summary("Get Current user")
    @security([{ Bearer: [] }])
    public static async getMe(ctx: Context): Promise<void> {


        const user = await User.findOne({ id: ctx.state.user.id });
        if (!user) {
            // return BAD REQUEST status code and user already exists error
            ctx.status = 400;
            ctx.body = "User doesn't Exist";
        }
        else {
            ctx.status = 200;
            ctx.body = await publify(user, public_field);
        }

    }

    @request("post", "/me")
    @summary("Edit a user Details")
    @body(editSchema)
    @security([{ Bearer: [] }])
    public static async editUser(ctx: Context): Promise<void> {
        const editData: EditUser = {
            email: ctx.request.body.email,
            password: ctx.request.body.password,
            name: ctx.request.body.name
        };

        const errors: ValidationError[] = await validate(editData); // errors is an array of validation errors

        if (errors.length > 0) {
            ctx.status = 400;
            ctx.body = errors;
            return;
        }
        const userToBeSaved: any = {};
        if (editData.password) {
            userToBeSaved.password = bcrypt.hashSync(editData.password, 8);
        }
        if (editData.name) {
            userToBeSaved.name = editData.name;
        }
        if (editData.email) {
            const verifyuser = await User.findOne({ email: editData.email });
            if (verifyuser && verifyuser.id !== ctx.state.user.id) {
                ctx.status = 400;
                ctx.body = "The specified e-mail address already exists";
                return;
            }
            else {

                userToBeSaved.email = editData.email;
            }
        }
        const user = await User.save({ id: ctx.state.user.id, ...userToBeSaved });
        ctx.status = 201;
        ctx.body = await publify(user, public_field);

    }

    //forget password
    //verify
    //change pass with token

    //verify email via url or email otp
}
