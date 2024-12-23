import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import * as dotenv from 'dotenv';

dotenv.config();
const config: any = {
    entities: ['./dist/**/*.entity.js'],
    entitiesTs: ['./src/**/*.entity.ts'],
    dbName: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    driver: PostgreSqlDriver,
    debug: process.env.IS_PROD !== 'true',

    
};

export default config;
