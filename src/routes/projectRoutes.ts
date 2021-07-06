import Router from "@koa/router";
import jwt from "koa-jwt";
import { project } from "../controller";

const projectRoute = new Router({
    prefix: "/projects"
});
projectRoute.use(jwt({ secret: process.env.JWT_SECRET }));

projectRoute.delete("/:projectID", project.deleteProject);
projectRoute.get("/generate_keys/:projectID", project.genAuthKeys);
projectRoute.get("/settings/:projectID", project.getAuthKeys);
projectRoute.get("/:rowsPerPage/:page", project.listProjects);
projectRoute.post("/create", project.createProject);
projectRoute.post("/:projectID", project.editProject);



export { projectRoute };