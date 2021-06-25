import { Context } from "koa";
import { getManager, Repository, Not, Equal, Like } from "typeorm";
import { validate, ValidationError } from "class-validator";
import { request, summary, path, body, responsesAll, tagsAll } from "koa-swagger-decorator";
import { User, userSchema } from "../entity/user";
import bcrypt from "bcrypt";

@responsesAll({ 200: { description: "success"}, 400: { description: "bad request"}, 401: { description: "unauthorized, missing/wrong jwt token"}})
@tagsAll(["User"])
export default class UserController {
    @request("post", "/users")
    @summary("Create a user")
    @body(userSchema)
    public static async createUser(ctx: Context): Promise<void> {
         // build up entity user to be saved
         const userToBeSaved: User =  User.create({
             name: ctx.request.body.name,
             email: ctx.request.body.email,
             password: bcrypt.hashSync(ctx.request.body.password,8),
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
             // save the user contained in the POST body
             const user = await User.save(userToBeSaved);
             // return CREATED status code and updated user
             ctx.status = 201;
             ctx.body = user;
            
    }

}

}
