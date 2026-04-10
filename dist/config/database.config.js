"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = void 0;
const path_1 = require("path");
const databaseConfig = (configService) => ({
    type: 'mysql',
    host: configService.get('DB_HOST', 'localhost'),
    port: parseInt(configService.get('DB_PORT', '3306'), 10),
    username: configService.get('DB_USERNAME', 'root'),
    password: configService.get('DB_PASSWORD', 'password'),
    database: configService.get('DB_NAME', 'test'),
    entities: [(0, path_1.join)(__dirname, '/../**/*.entity{.ts,.js}')],
    autoLoadEntities: true,
    synchronize: false,
    extra: {
        connectionLimit: 3,
        enableKeepAlive: true,
    },
});
exports.databaseConfig = databaseConfig;
//# sourceMappingURL=database.config.js.map