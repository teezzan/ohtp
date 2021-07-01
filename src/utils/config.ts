import dotenv from "dotenv";

dotenv.config({ path: ".env" });

export interface Config {
  port: number;
  debugLogging: boolean;
  dbsslconn: boolean;
  jwtSecret: string;
  databaseUrl: string;
  dbEntitiesPath: string[];
  cronJobExpression: string;
  serverURL: string;
}

const isDevMode = process.env.NODE_ENV == "development";

const config: Config = {
  port: +(process.env.PORT || 3000),
  debugLogging: isDevMode,
  dbsslconn: !isDevMode,
  jwtSecret: process.env.JWT_SECRET || "your-secret-whatever",
  databaseUrl: process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/apidb",
  dbEntitiesPath: [
    ...isDevMode ? ["src/entity/**/*.ts"] : ["dist/entity/**/*.js"],
  ],
  cronJobExpression: "0 * * * *",
  serverURL: "localhost:3000"
};

export { config };