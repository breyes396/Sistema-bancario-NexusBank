# Guía de prueba: enmascarado de DPI, correo y datos críticos (solo Admin)

## Objetivo
Validar que los endpoints administrativos de usuarios apliquen reglas de exposición y enmascarado para datos sensibles:

- Correo
- DPI / número de documento
- Teléfono
- Dirección
- Ingresos

Esta política fue aplicada **solo en vistas de Administrador**.

---

## Endpoints cubiertos

- `GET /nexusBank/v1/users`
- `GET /nexusBank/v1/users/:id`
- `GET /nexusBank/v1/users/admin/client/:id/detail`
- `PUT /nexusBank/v1/users/:id` (respuesta de actualización también enmascarada)

---

## Reglas de enmascarado implementadas

1. **Correo**
   - Formato: `ab***@d***.com`
   - Se conserva mínima trazabilidad, nunca el correo completo.

2. **DPI / DocumentNumber**
   - Se muestran únicamente los últimos 4 dígitos.
   - Ejemplo: `********1234`

3. **PhoneNumber**
   - Se muestran únicamente los últimos 3 dígitos.
   - Ejemplo: `*****321`

4. **Address**
   - Se conservan los primeros 6 caracteres y se oculta el resto.
   - Ejemplo: `Zona 1***`

5. **Income**
   - Se sustituye por `CONFIDENCIAL`

---

## Preparación en Postman

## 1) Variables de entorno
Crea un environment con estas variables:

- `baseUrl` = `http://localhost:3006/nexusBank/v1`
- `adminToken` = (vacío)
- `clientToken` = (vacío)
- `targetUserId` = (vacío)

## 2) Login Admin (guardar token)

### Request
- Método: `POST`
- URL: `{{baseUrl}}/auth/login`
- Body JSON:

```json
{
  "email": "<correo_admin>",
  "password": "<password_admin>"
}
```

### Tests (Postman)

```javascript
if (pm.response.code === 200) {
  const data = pm.response.json();
  pm.environment.set("adminToken", data.token);
}
```

## 3) Login Client (para prueba de acceso denegado)

### Request
- Método: `POST`
- URL: `{{baseUrl}}/auth/login`
- Body JSON:

```json
{
  "email": "<correo_cliente>",
  "password": "<password_cliente>"
}
```

### Tests (Postman)

```javascript
if (pm.response.code === 200) {
  const data = pm.response.json();
  pm.environment.set("clientToken", data.token);
}
```

---

## Caso A: listar usuarios como Admin (debe venir enmascarado)

### Request
- Método: `GET`
- URL: `{{baseUrl}}/users`
- Header: `Authorization: Bearer {{adminToken}}`

### Validar
Revisa que en cada usuario:
- `email` venga enmascarado (`***`)
- `profile.DocumentNumber` venga enmascarado
- `profile.PhoneNumber` venga enmascarado
- `profile.Address` venga parcial
- `profile.Income` sea `CONFIDENCIAL`

### Test sugerido

```javascript
pm.test("Listado admin con datos sensibles enmascarados", function () {
  pm.response.to.have.status(200);
  const body = pm.response.json();
  pm.expect(body.success).to.eql(true);

  if (Array.isArray(body.data) && body.data.length > 0) {
    const u = body.data[0];
    pm.expect(u.email).to.include("***");
    if (u.profile?.DocumentNumber) pm.expect(u.profile.DocumentNumber).to.match(/\*+/);
    if (u.profile?.Income !== null && u.profile?.Income !== undefined) pm.expect(u.profile.Income).to.eql("CONFIDENCIAL");
  }
});
```

---

## Caso B: detalle de usuario por ID como Admin

## 1) Obtén un `targetUserId`
Puedes tomar el `id` de cualquier usuario del Caso A y guardarlo en `targetUserId`.

## 2) Request detalle
- Método: `GET`
- URL: `{{baseUrl}}/users/{{targetUserId}}`
- Header: `Authorization: Bearer {{adminToken}}`

### Validar
- `data.email` enmascarado
- `data.UserProfile.DocumentNumber` enmascarado
- `data.UserProfile.Income = CONFIDENCIAL`

---

## Caso C: vista admin/client detail

### Request
- Método: `GET`
- URL: `{{baseUrl}}/users/admin/client/{{targetUserId}}/detail`
- Header: `Authorization: Bearer {{adminToken}}`

### Validar
En `data.client`:
- `email` enmascarado
- `profile.DocumentNumber` enmascarado
- `profile.PhoneNumber` enmascarado
- `profile.Address` parcial
- `profile.Income = CONFIDENCIAL`

---

## Caso D: acceso de cliente (debe ser bloqueado)

### Request
- Método: `GET`
- URL: `{{baseUrl}}/users`
- Header: `Authorization: Bearer {{clientToken}}`

### Resultado esperado
- HTTP `403`
- Mensaje de acceso denegado

---

## Caso E: actualización de usuario y respuesta enmascarada

### Request
- Método: `PUT`
- URL: `{{baseUrl}}/users/{{targetUserId}}`
- Header: `Authorization: Bearer {{adminToken}}`
- Body JSON (ejemplo):

```json
{
  "phoneNumber": "55551234",
  "address": "Zona 10, Ciudad"
}
```

### Validar
En la respuesta `data`:
- `email` enmascarado
- `profile.PhoneNumber` enmascarado
- `profile.Address` parcial
- `profile.DocumentNumber` enmascarado
- `profile.Income = CONFIDENCIAL` (si existe en perfil)

---

## Notas importantes

- Esta política fue aplicada únicamente a **endpoints de administración de usuarios**.
- El control de acceso continúa vigente: rutas protegidas por rol `Admin`.
- El sistema mantiene auditoría sensible en `getAdminClientDetail`.

---

## Resumen rápido (checklist)

- [ ] Admin puede consultar usuarios.
- [ ] Admin ve correo enmascarado.
- [ ] Admin ve DPI enmascarado.
- [ ] Admin ve teléfono/dirección enmascarados.
- [ ] Admin ve ingreso como `CONFIDENCIAL`.
- [ ] Cliente no puede acceder (403) a rutas admin.

---

**Fecha:** 2026-02-28
