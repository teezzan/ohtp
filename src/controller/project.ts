import { Context } from "koa";
import { validate, ValidationError } from "class-validator";
import { request, summary, body, responsesAll, tagsAll, security } from "koa-swagger-decorator";
import { User } from "../entity/user";
import { } from "../interfaces/user";
import { publify } from "../utils/publify";
import { config } from "../utils/config";
import { createProjectSchema } from "../interfaces/project";
import { Project } from "../entity/project";

const public_field = ["id", "name", "email", "isVerified", "token"];

@responsesAll({ 200: { description: "success" }, 400: { description: "bad request" }, 401: { description: "unauthorized, missing/wrong jwt token" } })
@tagsAll(["Project"])
export default class ProjectController {

    @request("post", "/create")
    @summary("Create a Project")
    @body(createProjectSchema)
    public static async createProject(ctx: Context): Promise<void> {
        const projectToBeSaved: Project = Project.create({
            name: ctx.request.body.name,
        });

        const errors: ValidationError[] = await validate(projectToBeSaved);



    }
}