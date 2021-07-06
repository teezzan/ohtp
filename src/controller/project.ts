import { Context } from "koa";
import { validate, ValidationError } from "class-validator";
import { request, summary, body, responsesAll, tagsAll, security, path } from "koa-swagger-decorator";
import { createProjectSchema, EditProject, editProjectSchema } from "../interfaces/project";
import { Project } from "../entity/project";
import { Subscription } from "../entity/subscription";
import { getManager } from "typeorm";
import { GenerateKey } from "../utils/crypto";
import { publify } from "../utils/publify";
import { config } from "../utils/config";
import { update } from "lodash";

const public_field = ["id", "name", "subscription",];

@responsesAll({ 200: { description: "success" }, 400: { description: "bad request" }, 401: { description: "unauthorized, missing/wrong jwt token" }, 442: { description: "Unprocessable Entity" } })
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

    @request("get", "/projects/generate_keys/{projectID}")
    @summary("Generate Project's key")
    @security([{ Bearer: [] }])
    @path({
        projectID: { type: "string", required: true, description: "Project ID" }
    })
    public static async genAuthKeys(ctx: Context): Promise<void> {
        const public_key = `PTP-${GenerateKey(12)}`
        const secret_key = `STP-${GenerateKey(12)}`
        const updated = await Project.update({ id: ctx.params.projectID, user: ctx.state.user.id }, {
            secret_key,
            public_key
        });
        if (updated.affected == 1) {
            ctx.status = 200;
            ctx.body = { secret_key, public_key };
            return;
        }
        ctx.status = 400;
        ctx.body = "Project Does Not exist";
        return;

    }

    @request("get", "/projects/settings/{projectID}")
    @summary("Get Project's  Settings key")
    @security([{ Bearer: [] }])
    @path({
        projectID: { type: "string", required: true, description: "Project ID" }
    })
    public static async getAuthKeys(ctx: Context): Promise<void> {

        const project = await getManager()
            .createQueryBuilder(Project, "project")
            .addSelect(["project.secret_key", "project.public_key", "project.webhook_url", "project.callback_url"])
            .where("project.user = :userId", { userId: ctx.state.user.id })
            .where("project.id = :id", { id: ctx.params.projectID })
            .getOne();
        ctx.status = 200;
        ctx.body = project;
        return;

    }

    @request("delete", "/projects/{projectID}")
    @summary("delete Project")
    @security([{ Bearer: [] }])
    @path({
        projectID: { type: "string", required: true, description: "Project ID" }
    })
    public static async deleteProject(ctx: Context): Promise<void> {

        const project = await getManager()
            .createQueryBuilder(Project, "project")
            .delete()
            .where("project.user = :userId", { userId: ctx.state.user.id })
            .where("project.id = :id", { id: ctx.params.projectID })
            .execute();
        ctx.status = 200;
        ctx.body = "Success";
        return;

    }

    @request("post", "/projects/{projectID}")
    @summary("Edit a Project Details")
    @body(editProjectSchema)
    @security([{ Bearer: [] }])
    @path({
        projectID: { type: "string", required: true, description: "Project ID" }
    })
    public static async editProject(ctx: Context): Promise<void> {
        const editData: EditProject = {
            name: ctx.request.body.name,
            webhook_url: ctx.request.body.webhook_url,
            callback_url: ctx.request.body.callback_url
        };

        const errors: ValidationError[] = await validate(editData); // errors is an array of validation errors

        if (errors.length > 0) {
            ctx.status = 400;
            ctx.body = errors;
            return;
        }
        const projectToBeSaved: any = {};
        if (editData.name) {
            const project = await Project.findOne({ name: editData.name, id: ctx.params.projectID });
            if (project) {
                ctx.status = 400;
                ctx.body = "The specified name already exists";
                return;
            } else {

                projectToBeSaved.name = editData.name;
            }

        }
        if (editData.webhook_url) {
            projectToBeSaved.webhook_url = editData.webhook_url;
        }
        if (editData.callback_url) {
            projectToBeSaved.callback_url = editData.callback_url;
        }

        // const project = await getManager()
        //     .createQueryBuilder(Project, "project")
        //     .update()
        //     .set(projectToBeSaved)
        //     .where("id = :id", { id: ctx.params.projectID })
        //     .where("project.user = :userId", { userId: ctx.state.user.id })
        //     .execute();

        const updated = await Project.save({
            id: ctx.params.projectID, 
            user: ctx.state.user.id,
            ...projectToBeSaved
        });
        ctx.status = 201;
        ctx.body = await Project.findOne({id: ctx.params.projectID, user: ctx.state.user.id,});

    }
}