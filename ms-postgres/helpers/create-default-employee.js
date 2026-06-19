import bcrypt from 'bcryptjs';
import { User, UserProfile } from '../src/user/user.model.js';
import { UserEmail } from '../src/auth/userEmail.model.js';
import { Role, UserRole } from '../src/auth/role.model.js';

export async function createDefaultEmployee() {
  const employeeEmail = 'empleado@nexusbank.com';
  const employeeUsername = 'EMPLEADO1';
  const employeePassword = 'EMPLEADO1';

  // Asegurar que el rol Empleado exista
  const [employeeRole] = await Role.findOrCreate({
    where: { name: 'Empleado' },
    defaults: { description: 'Usuario trabajador del banco' }
  });

  // Buscar o crear el usuario empleado
  let user = await User.findOne({ where: { email: employeeEmail } });

  if (!user) {
    const hash = await bcrypt.hash(employeePassword, 10);
    user = await User.create({
      email: employeeEmail,
      password: hash,
      status: true,
      isVerified: true
    });
    console.log('✅ Empleado creado por primera vez.');
  } else {
    // Ya existe: resetear contraseña para asegurar que sea correcta
    const hash = await bcrypt.hash(employeePassword, 10);
    user.password = hash;
    user.status = true;
    user.isVerified = true;
    await user.save();
    console.log('🔄 Contraseña del empleado sincronizada.');
  }

  // Asegurar que el UserRole exista (solo rol Empleado)
  const existingRole = await UserRole.findOne({ where: { UserId: user.id } });
  if (!existingRole) {
    await UserRole.create({ UserId: user.id, RoleId: employeeRole.id });
    console.log('✅ Rol de empleado asignado.');
  }

  // Asegurar que el UserEmail exista
  const existingEmail = await UserEmail.findOne({ where: { userId: user.id } });
  if (!existingEmail) {
    await UserEmail.create({ userId: user.id, email: employeeEmail, verified: true });
    console.log('✅ Email de empleado registrado.');
  }

  // Asegurar que el UserProfile exista con el Username correcto
  const existingProfile = await UserProfile.findOne({ where: { UserId: user.id } });
  if (!existingProfile) {
    await UserProfile.create({
      Name: 'Empleado NexusBank',
      Username: employeeUsername,
      PhoneNumber: '55555556',
      Address: 'Sucursal Central',
      JobName: 'Empleado Bancario',
      DocumentType: 'DPI',
      DocumentNumber: '1111111111111',
      Income: 5000,
      Status: true,
      UserId: user.id
    });
    console.log('✅ Perfil de empleado creado.');
  } else if (existingProfile.Username !== employeeUsername) {
    existingProfile.Username = employeeUsername;
    await existingProfile.save();
    console.log('🔄 Username de empleado corregido a EMPLEADO1.');
  }

  console.log(`🚀 Empleado listo → usuario: ${employeeUsername} / contraseña: ${employeePassword}`);
}
