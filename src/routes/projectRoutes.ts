import Router from "@koa/router";
import jwt from "koa-jwt";
import { project } from "../controller";

const projectRoute = new Router({
    prefix: "/projects"
});
projectRoute.use(jwt({ secret: process.env.JWT_SECRET }));

projectRoute.post("/create", project.createProject);

export { projectRoute };