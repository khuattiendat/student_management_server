import { DataSource } from 'typeorm';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

export async function seedAdmin(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);

  const userName = process.env.SEED_ADMIN_USERNAME || 'admin';

  const exists = await userRepo.findOne({ where: { userName } });
  if (exists) return;

  const passwordText = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  const password = await bcrypt.hash(passwordText, 10);
  const name = process.env.SEED_ADMIN_NAME || 'Admin';

  await userRepo.save(
    userRepo.create({
      userName,
      password,
      name,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    }),
  );

  console.log('✔ Admin user created');
}
