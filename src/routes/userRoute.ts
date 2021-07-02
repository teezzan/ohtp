import { SwaggerRouter } from "koa-swagger-decorator";
import { user } from "../controller";
import jwt from "koa-jwt";
import path from "path";

const userRoute = new SwaggerRouter({
    prefix: "/users"
});
// Swagger endpoint
userRoute.swagger({
    title: "ohtp",
    description: "Ohtp is a secured otp service.",
    version: "1.0.0",
    swaggerOptions: {
        securityDefinitions: {
            Bearer: {
                type: "apiKey",
                in: "header",
                name: "Authorization",
            },
        },
    },
});

userRoute.post("/register", user.createUser);
userRoute.post("/login", user.login);
userRoute.post("/forgetpassword", user.forgetPassword);
userRoute.post("/verifytoken", user.verifyforgetPasswordToken);
userRoute.post("/resetpassword", user.changePasswordwithToken);
userRoute.post("/verify", user.verifyAccount);

userRoute.use(jwt({ secret: process.env.JWT_SECRET }));
userRoute.get("/me", user.getMe);
userRoute.post("/me", user.editUser);

// USER ROUTES
// userRoute.get("/users", user.getUsers);
// userRoute.get("/users/:id", user.getUser);
// userRoute.put("/users/:id", user.updateUser);
// userRoute.delete("/users/:id", user.deleteUser);
// userRoute.delete("/testusers", user.deleteTestUsers);


// mapDir will scan the input dir, and automatically call router.map to all Router Class
const dirPath = path.join(__dirname, "../");
userRoute.mapDir(dirPath);

export { userRoute };