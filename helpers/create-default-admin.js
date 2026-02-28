import bcrypt from 'bcryptjs';
import { User, UserProfile } from '../src/user/user.model.js';
import { UserEmail } from '../src/auth/userEmail.model.js';
import { Role, UserRole } from '../src/auth/role.model.js';

export async function createDefaultAdmin() {
  const adminEmail = 'adminb@nexusbank.com';
  const adminUsername = 'ADMINB';
  const adminPassword = 'ADMINB';

  const [adminRole] = await Role.findOrCreate({
    where: { name: 'Administrador' },
    defaults: { description: 'Usuario con privilegios totales' }
  });

  await Role.findOrCreate({
    where: { name: 'Cliente' },
    defaults: { description: 'Usuario cliente del banco' }
  });

  await Role.findOrCreate({
    where: { name: 'Empleado' },
    defaults: { description: 'Usuario trabajador del banco' }
  });

  let user = await User.findOne({ where: { email: adminEmail } });
  if (!user) {
    const hash = await bcrypt.hash(adminPassword, 10);
    user = await User.create({
      email: adminEmail,
      password: hash,
      status: true,
      isVerified: true
    });
    await UserRole.create({
      UserId: user.id,
      RoleId: adminRole.id
    });
    await UserEmail.create({
      userId: user.id,
      email: adminEmail,
      verified: true
    });
    await UserProfile.create({
      Name: 'Administrador Banco',
      Username: adminUsername,
      PhoneNumber: '55555555',
      Address: 'Oficina Central',
      JobName: 'Administrador',
      DocumentType: 'DPI',
      DocumentNumber: '0000000000000',
      Income: 10000,
      Status: true,
      UserId: user.id
    });
    console.log('Administrador creado: ADMINB/ADMINB');
  } else {
    console.log('Administrador ya existe.');
  }
}
