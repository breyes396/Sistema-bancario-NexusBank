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

  // Buscar o crear el usuario admin
  let user = await User.findOne({ where: { email: adminEmail } });

  if (!user) {
    // Primera vez: crear el usuario
    const hash = await bcrypt.hash(adminPassword, 10);
    user = await User.create({
      email: adminEmail,
      password: hash,
      status: true,
      isVerified: true
    });
    console.log('✅ Administrador creado por primera vez.');
  } else {
    // Ya existe: resetear contraseña para asegurar que sea correcta
    const hash = await bcrypt.hash(adminPassword, 10);
    user.password = hash;
    user.status = true;
    user.isVerified = true;
    await user.save();
    console.log('🔄 Contraseña del administrador sincronizada.');
  }

  // Asegurar que el UserRole exista
  const existingRole = await UserRole.findOne({ where: { UserId: user.id } });
  if (!existingRole) {
    await UserRole.create({ UserId: user.id, RoleId: adminRole.id });
    console.log('✅ Rol de administrador asignado.');
  }

  // Asegurar que el UserEmail exista
  const existingEmail = await UserEmail.findOne({ where: { userId: user.id } });
  if (!existingEmail) {
    await UserEmail.create({ userId: user.id, email: adminEmail, verified: true });
    console.log('✅ Email de administrador registrado.');
  }

  // Asegurar que el UserProfile exista con el Username correcto
  const existingProfile = await UserProfile.findOne({ where: { UserId: user.id } });
  if (!existingProfile) {
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
    console.log('✅ Perfil de administrador creado.');
  } else if (existingProfile.Username !== adminUsername) {
    existingProfile.Username = adminUsername;
    await existingProfile.save();
    console.log('🔄 Username de administrador corregido a ADMINB.');
  }

  console.log(`🚀 Admin listo → usuario: ${adminUsername} / contraseña: ${adminPassword}`);
}