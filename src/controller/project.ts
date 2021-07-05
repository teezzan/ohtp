import { Context } from "koa";
import { validate, ValidationError } from "class-validator";
import { request, summary, body, responsesAll, tagsAll, security, path } from "koa-swagger-decorator";
import { createProjectSchema } from "../interfaces/project";
import { Project } from "../entity/project";
import { Subscription } from "../entity/subscription";
import { getManager } from "typeorm";
import { User } from "../entity/user";
import { publify } from "../utils/publify";
import { config } from "../utils/config";

const public_field = ["id", "name", "subscription"];

@responsesAll({ 200: { description: "success" }, 400: { description: "bad request" }, 401: { description: "unauthorized, missing/wrong jwt token" }, 442:{description:"Unprocessable Entity"} })
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
            let new_sub = await Subscription.save(subscription);

            new_project.subscription = new_sub;
            new_project = await Project.save(new_project);
            ctx.status = 201;
            ctx.body = new_project;
        }
        else {
            ctx.status = 400;
            ctx.body = "The specified project name exists";
        }
    }

    @request("get", "/projects/{rowsPerPage}/{page}")
    @summary("Get all Project")
    @path({
        rowsPerPage: { type: "number", required: true, description: "Number of Project Per page" },
        page: { type: "number", required: true, description: "Page Number" },
    })
    @security([{ Bearer: [] }])
    public static async listProjects(ctx: Context): Promise<void> {


        let page = parseInt(ctx.params.page);
        let rowsPerPage = parseInt(ctx.params.rowsPerPage);
        let skip_number = rowsPerPage * (page - 1);
        if (page <= 0) {
            ctx.status = 442;
            ctx.body = "page should be greater than 0"; 
            return
        }
        if (rowsPerPage <= 0) {
            ctx.status = 442;
            ctx.body = "rowsPerPage should be greater than 0"; 
            return
        }


        const projects = await getManager()
            .createQueryBuilder(Project, "project")
            // .leftJoinAndSelect("project.subscription", "subscription", "subscription.total = :total", { total: 200 })
            .leftJoinAndSelect("project.subscription", "subscription")
            .where("project.user = :id", { id: ctx.state.user.id })
            .skip(skip_number || 0)
            .take(rowsPerPage || 5)
            .getMany();

        ctx.status = 200;
        ctx.body = projects;

    }
}