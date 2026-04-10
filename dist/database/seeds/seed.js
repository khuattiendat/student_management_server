"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../data-source");
const seed_admin_1 = require("./seed.admin");
async function bootstrap() {
    await data_source_1.AppDataSource.initialize();
    console.log('🌱 Seeding database...');
    await (0, seed_admin_1.seedAdmin)(data_source_1.AppDataSource);
    await data_source_1.AppDataSource.destroy();
    console.log('✅ Seeding done');
}
bootstrap().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map