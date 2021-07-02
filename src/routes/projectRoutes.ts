import Router from "@koa/router";
import { project } from "../controller";

const projectRouter = new Router({
    prefix: "/projects"
});

projectRouter.post("/create", project.createProject);

export { projectRouter };