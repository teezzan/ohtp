import { SwaggerRouter } from "koa-swagger-decorator";
import { user } from "../controller";

const userRoute = new SwaggerRouter({
    prefix: '/users'
});

userRoute.post("/register", user.createUser);
userRoute.post("/login", user.login);
// USER ROUTES
// userRoute.get("/users", user.getUsers);
// userRoute.get("/users/:id", user.getUser);
// userRoute.put("/users/:id", user.updateUser);
// userRoute.delete("/users/:id", user.deleteUser);
// userRoute.delete("/testusers", user.deleteTestUsers);

// Swagger endpoint
userRoute.swagger({
    title: "ohtp",
    description: "Ohtp is a secured otp service.",
    version: "1.0.0"
});

// mapDir will scan the input dir, and automatically call router.map to all Router Class
userRoute.mapDir(__dirname);

export { userRoute };