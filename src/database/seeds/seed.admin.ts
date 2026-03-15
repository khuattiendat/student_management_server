import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

export async function seedAdmin(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);

  const userName = 'adminSystem';

  const exists = await userRepo.findOne({ where: { userName } });
  if (exists) return;

  const password = await bcrypt.hash('admin123', 10);
  const fullName = 'System Admin';

  await userRepo.save(
    userRepo.create({
      userName,
      password,
      name: fullName,
    }),
  );

  console.log('✔ Admin user created');
}
