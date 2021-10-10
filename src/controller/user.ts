import { Context } from "koa";
import JsonWebToken from "jsonwebtoken";
import { validate, ValidationError } from "class-validator";
import bcrypt from "bcrypt";
import { request, summary, body, responsesAll, tagsAll, security } from "koa-swagger-decorator";


import { User, userSchema } from "../entity/user";
import {
    editSchema,
    EditUser,
    ForgetPassword,
    forgetpasswordSchema,
    Login,
    loginSchema,
    Token,
    tokenSchema,
    passwordTokenSchema,
    PasswordAndToken
} from "../interfaces/user";
import { publify } from "../utils/publify";
import { EncryptPayload, GenerateOTP, DecryptPayload } from "../utils/crypto";
import { config } from "../utils/config";
import { SendEmail } from "../mediums/email";
import { getManager } from "typeorm";

const public_field = ["id", "name", "email", "isVerified", "token"];


@responsesAll({ 200: { description: "success" }, 400: { description: "bad request" }, 401: { description: "unauthorized, missing/wrong jwt token" } })
@tagsAll(["User"])
export default class UserController {
    @request("post", "/users/register")
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
            UserController.generateVerifyandSend(user);
            ctx.status = 201;
            ctx.body = await publify(user, public_field);

        }

    }

    @request("post", "/users/login")
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

        const user = await getManager()
            .createQueryBuilder(User, "user")
            .addSelect("user.password")
            .where("user.email = :email", { email: loginData.email })
            .getOne();

        console.log((await bcrypt.compare(loginData.password, user.password)));
        if (!user) {
            ctx.status = 400;
            ctx.body = "The specified e-mail address does not exists";
        }
        else if (!(await bcrypt.compare(loginData.password, user.password))) {
            ctx.status = 400;
            ctx.body = "Wrong Password";
        }
        else if (user.isVerified) {

            const token = JsonWebToken.sign({
                id: user.id,
                email: user.email
            }, process.env.JWT_SECRET);
            ctx.status = 201;
            ctx.body = await publify({ ...user, token }, public_field);
            return;
        }
        else if (user.isVerified == false) {
            await UserController.generateVerifyandSend(user);
            ctx.status = 200;
            ctx.body = {
                message: "Please Verify Your Account. An Email has been Sent."
            };
        }


    }

    @request("get", "/users/me")
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

    @request("post", "/users/me")
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
    @request("post", "/users/forgetpassword")
    @summary("Send Password retrieval verification mail to a user")
    @body(forgetpasswordSchema)

    public static async forgetPassword(ctx: Context): Promise<void> {
        const forgetPasswordData: ForgetPassword = {
            email: ctx.request.body.email
        };

        const errors: ValidationError[] = await validate(forgetPasswordData); // errors is an array of validation errors

        if (errors.length > 0) {
            ctx.status = 400;
            ctx.body = errors;
            return;
        }
        const user = await User.findOne({ email: forgetPasswordData.email });
        if (!user) {
            // return BAD REQUEST status code and email already exists error
            ctx.status = 400;
            ctx.body = "The specified e-mail address does not exists";
        } else {
            const otp = GenerateOTP();
            const token = await EncryptPayload({
                otp,
                id: user.id
            });
            await User.update({ id: user.id }, { otp });
            console.log(`${config.serverURL}/verify/${token}`);
            ctx.status = 200;
            ctx.body = {
                message: "Email Sent.",
                url: `${config.serverURL}/verify/${token}`
            };


        }

    }
    //verify
    @request("post", "/users/verifytoken")
    @summary("verify token Active ")
    @body(tokenSchema)

    public static async verifyforgetPasswordToken(ctx: Context): Promise<void> {
        const tokenData: Token = {
            token: ctx.request.body.token
        };

        const errors: ValidationError[] = await validate(tokenData); // errors is an array of validation errors

        if (errors.length > 0) {
            ctx.status = 400;
            ctx.body = errors;
            return;
        }
        const status = await DecryptPayload(tokenData.token);

        const user = await User.findOne({
            id: status.id,
            otp: status.otp,
        });
        if (!user) {
            ctx.status = 400;
            ctx.body = "Invalid Token";
        } else {
            // await User.update({ id: user.id }, { otp });
            await User.update({ id: user.id }, { otp: null });

            ctx.status = 200;
            ctx.body = {
                message: "Valid Token",
            };


        }

    }

    @request("post", "/users/resetpassword")
    @summary("Change password with token")
    @body(passwordTokenSchema)

    public static async changePasswordwithToken(ctx: Context): Promise<void> {
        const tokenData: PasswordAndToken = {
            token: ctx.request.body.token,
            password: ctx.request.body.password
        };

        const errors: ValidationError[] = await validate(tokenData);

        if (errors.length > 0) {
            ctx.status = 400;
            ctx.body = errors;
            return;
        }
        const status = await DecryptPayload(tokenData.token);

        const user = await User.findOne({
            id: status.id,
            otp: status.otp,
        });
        if (!user) {
            ctx.status = 400;
            ctx.body = "Invalid Token";
        } else {
            await User.update({ id: user.id }, { otp: null, password: bcrypt.hashSync(tokenData.password, 8) });

            ctx.status = 200;
            ctx.body = {
                message: "Success",
            };

        }

    }

    @request("post", "/users/verify")
    @summary("Verify User Account")
    @body(tokenSchema)

    public static async verifyAccount(ctx: Context): Promise<void> {
        const tokenData: Token = {
            token: ctx.request.body.token
        };

        const errors: ValidationError[] = await validate(tokenData);

        if (errors.length > 0) {
            ctx.status = 400;
            ctx.body = errors;
            return;
        }
        const status = await DecryptPayload(tokenData.token);

        const user = await User.findOne({
            id: status.id,
            otp: status.otp,
        });
        if (!user) {
            ctx.status = 400;
            ctx.body = "Invalid Token";
        } else {
            await User.update({ id: user.id }, { otp: null, isVerified: true });

            ctx.status = 200;
            ctx.body = {
                message: "Verified",
            };


        }

    }

    private static generateVerifyandSend = async (user: User): Promise<void> => {
        const otp = GenerateOTP();
        const token = await EncryptPayload({
            otp,
            id: user.id
        });
        await User.update({ id: user.id }, { otp });
        //send email
        const payload = {
            from: "\"OhTP 👻\" <foo@ohtp.com>",
            to: user.email,
            subject: "Verify Your Account✔.",
            text: "Please verify",
            html: `<b>Click Here to verify </b>
            <a href='${config.serverURL}/accountverify/${token}' >
            Verify Account</a>`,
        };
        console.log(`${config.serverURL}/accountverify/${token}`);
        await SendEmail(payload);
    }
}
