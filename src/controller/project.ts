import { Context } from "koa";
import { validate, ValidationError } from "class-validator";
import { request, summary, body, responsesAll, tagsAll, security } from "koa-swagger-decorator";
import { createProjectSchema } from "../interfaces/project";
import { Project } from "../entity/project";
import { Subscription } from "../entity/subscription";
import { User } from "../entity/user";
import { publify } from "../utils/publify";
import { config } from "../utils/config";

const public_field = ["id", "name", "subscription"];

@responsesAll({ 200: { description: "success" }, 400: { description: "bad request" }, 401: { description: "unauthorized, missing/wrong jwt token" } })
@tagsAll(["Project"])
export default class ProjectController {

    @request("post", "/projects/create")
    @summary("Create a Project")
    @security([{ Bearer: [] }])
    @body(createProjectSchema)
    public static async createProject(ctx: Context): Promise<void> {
        const projectToBeSaved: Project = Project.create({
            name: ctx.request.body.name,
            user: ctx.state.user.id
        });

        const errors: ValidationError[] = await validate(projectToBeSaved);
        if (errors.length > 0) {
            ctx.status = 400;
            ctx.body = errors;
            return;
        }
        const project = await Project.findOne({ name: projectToBeSaved.name });
        if (!project) {
            let new_project = await Project.save(projectToBeSaved);

            const date = new Date();
            date.setDate(date.getDate() + 30);

            const subscription: Subscription = Subscription.create({
                value: "Free Tier",
                total: 200,
                project: new_project,
                expiry: date,
            });
            new_project.subscription = subscription;
            new_project = await Project.save(new_project);
            ctx.status = 201;
            ctx.body = new_project;
        }
        else {
            ctx.status = 400;
            ctx.body = "The specified project name exists";
        }
    }

    @request("get", "/projects/")
    @summary("Get all Project")
    @security([{ Bearer: [] }])
    @body(createProjectSchema)
    public static async listProjects(ctx: Context): Promise<void> {

        const projects = await Project.findOne({ user: ctx.state.user.id });

        ctx.status = 200;
        ctx.body = projects;

    }
}