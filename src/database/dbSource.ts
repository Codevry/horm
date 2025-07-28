import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "@/entity/entityUser.ts"; // Assuming you have a User entity

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "database.sqlite", // This will create a file named database.sqlite in your project root
    synchronize: true, // Auto-create table schemas based on your entities (use with caution in production)
    logging: true, // Set to true to see SQL queries in your console
    entities: [User], // List your entities here
    migrations: [],
    subscribers: [],
});