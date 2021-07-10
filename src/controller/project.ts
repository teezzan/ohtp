import { Context } from "koa";
import { validate, ValidationError } from "class-validator";
import { getManager } from "typeorm";
import { RedisClient } from "redis";
import { request, summary, body, responsesAll, tagsAll, security, path } from "koa-swagger-decorator";

import { createProjectSchema, EditProject, editProjectSchema, GenerateEmailOTP, generateEmailOTPSchema } from "../interfaces/project";
import { Project } from "../entity/project";
import { Medium, Otp, Type } from "../entity/otp";
import { Subscription } from "../entity/subscription";
import { DecryptPayload, EncryptPayload, EncryptPayloadForOTP, GenerateKey, GenerateOTP } from "../utils/crypto";
import { SendEmail } from "../mediums/email";
import { config } from "../utils/config";
import { promisify } from "util";
import { Token } from "../interfaces/user";
import { SendWebHook } from "../mediums/webhook";

const redisClient = new RedisClient({ url: process.env.REDIS_URL })
const setAsync = promisify(redisClient.set).bind(redisClient);
const getAsync = promisify(redisClient.get).bind(redisClient);

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
        let projectToBeSaved: any = {};
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

        await Project.save({
            id: ctx.params.projectID,
            user: ctx.state.user.id,
            ...projectToBeSaved
        });
        ctx.status = 201;
        ctx.body = await Project.findOne({ id: ctx.params.projectID, user: ctx.state.user.id, });

    }

    public static async getProjectBySecretKey(secret_key: string): Promise<Project | null> {
        const project = await getManager()
            .createQueryBuilder(Project, "project")
            .addSelect(["project.secret_key", "project.public_key", "project.webhook_url", "project.callback_url"])
            .where("project.secret_key = :secret_key", { secret_key: secret_key })
            .getOne();
        return project;

    }

    @request("post", "/otp/email")
    @summary("generate email OTP")
    @security([{ Bearer: [] }])
    @body(generateEmailOTPSchema)


    public static async generateEmailOTP(ctx: Context): Promise<void> {
        const otpData: GenerateEmailOTP = {
            email: ctx.request.body.email,
            type: ctx.request.body.type,
            expiry: ctx.request.body.expiry || 2,
            meta: ctx.request.body.meta,

        }

        const id = ctx.state.cached_data.id;

        const errors: ValidationError[] = await validate(otpData);
        if (errors.length > 0) {
            ctx.status = 400;
            ctx.body = errors;
            return;
        }
        let otpToBeSaved: any = {};

        const currentDate = new Date();
        currentDate.setHours(currentDate.getHours() + otpData.expiry);

        otpToBeSaved.expiry = currentDate;
        otpToBeSaved.isActive = true;
        otpToBeSaved.project = id;
        otpToBeSaved.medium = Medium.EMAIL;
        otpToBeSaved.email = otpData.email;

        if (otpData.meta) {
            otpToBeSaved.meta = JSON.stringify(otpData.meta);
        }
        else {
            otpToBeSaved.meta = JSON.stringify({});
        }

        if (otpData.type == Type.NUMBER) {
            otpToBeSaved.value = String(await GenerateOTP());
            otpToBeSaved.type = Type.NUMBER;
        }
        else if (otpData.type == Type.URL) {
            otpToBeSaved.value = String(GenerateKey(12));
            otpToBeSaved.type = Type.URL;

        }
        else {
            ctx.status = 400;
            ctx.body = "Invalid OTP type!";
            return;
        }

        let savedOtp: Otp = Otp.create(otpToBeSaved as Otp);
        savedOtp = await Otp.save(savedOtp);


        let token;
        if (otpData.type == Type.URL) {
            token = await EncryptPayloadForOTP({
                projectId: id,
                otpId: savedOtp.id,
                value: otpToBeSaved.value,

            });
        }
        else {
            token = otpToBeSaved.value;
        }

        ProjectController.generateEmailandSend(otpData.email, otpData.type, token)
            .then(x => {
                console.log("Sent")
            });

        setAsync(`${otpToBeSaved.value}::${id}`,
            JSON.stringify({
                meta: otpData.meta,
                projectId: id,
                otpId: savedOtp.id,
                expiry: otpToBeSaved.expiry,
                callback_url: ctx.state.cached_data.callback_url,
                webhook_url: ctx.state.cached_data.webhook_url,
                secret_key: ctx.state.cached_data.secret_key,
                private_key: ctx.state.cached_data.private_key,
                isActive: true,

            })).then((x: any) => {
                console.log("Added");
            }).catch((err: any) => {
                console.log(err);
            })

        ctx.status = 200;
        ctx.body = {
            otp: otpToBeSaved.value,
            id: savedOtp.id
        };
    }

    @request("get", "/otp/verify/{token}")
    @summary("Verify otp")
    @path({
        token: { type: "string", required: true, description: "token" }
    })
    public static async verifyAccount(ctx: Context): Promise<void> {
        const tokenData: Token = {
            token: ctx.params.token
        };

        const errors: ValidationError[] = await validate(tokenData);

        if (errors.length > 0) {
            ctx.status = 400;
            ctx.body = errors;
            return;
        }

        const status = await DecryptPayload(tokenData.token);
        //get from redis
        let data = JSON.parse(await getAsync(`${status.value}::${status.projectId}`));
        if (data.expiry > new Date()) {
            ctx.status = 400;
            ctx.body = "Expired Token!";
            return;
        }
        if (!data.isActive) {
            ctx.status = 400;
            ctx.body = "InActive Token!";
            return;
        }

        //change to inactive and send webhook. Will optimize later
        Otp.update({ id: data.otpId }, { isActive: false }).then((x: any) => {
            console.log("Updated ", x.affected);

        }).catch((err: any) => {
            console.log(err);
        })

        data.isActive = false;

        setAsync(`${status.value}::${status.projectId}`,
            JSON.stringify(data)
        ).then((x: any) => {
            console.log("Set isACtive to false");

        }).catch((err: any) => {
            console.log(err);
        })

        //send webhook and redirect
        SendWebHook({
            secret_key: data.secret_key,
            webhook_url: data.webhook_url,
            meta: data.meta,
            medium: Medium.EMAIL,
            type: Type.URL
        }).then((x: any) => {
            console.log("Sent or pushed to queue");
        }).catch((err: any) => {
            console.log(err);
        })

        if (data.callback_url !== null) {
            ctx.redirect(data.callback_url); // redirect to another page
            return;
        }
        else {
            ctx.status = 200;
            ctx.body = "You have successfully verified the otp"
        }

    }


    private static generateEmailandSend = async (email: string, type: string, token: string): Promise<void> => {
        let html = "";
        if (type == Type.URL) {

            html = `<b>Click Here to verify </b>
            <a href='${config.serverURL}/otp/verify/${token}' >
            Verify Account</a>`
        } else {
            html = `<b>Your OTP is ${token}</b> Go to the website to confirm it`

        }
        const payload = {
            from: "\"OhTP 👻\" <foo@ohtp.com>",
            to: email,
            subject: "Authentication✔.",
            text: "Please Auth",
            html,
        };
        await SendEmail(payload);
    }



}