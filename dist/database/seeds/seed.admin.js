"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdmin = seedAdmin;
const user_entity_1 = require("../entities/user.entity");
const bcrypt = require("bcrypt");
async function seedAdmin(dataSource) {
    const userRepo = dataSource.getRepository(user_entity_1.User);
    const userName = process.env.SEED_ADMIN_USERNAME || 'admin';
    const exists = await userRepo.findOne({ where: { userName } });
    if (exists)
        return;
    const passwordText = process.env.SEED_ADMIN_PASSWORD || 'admin123';
    const password = await bcrypt.hash(passwordText, 10);
    const name = process.env.SEED_ADMIN_NAME || 'Admin';
    await userRepo.save(userRepo.create({
        userName,
        password,
        name,
        role: user_entity_1.UserRole.ADMIN,
        status: user_entity_1.UserStatus.ACTIVE,
    }));
    console.log('✔ Admin user created');
}
//# sourceMappingURL=seed.admin.js.map