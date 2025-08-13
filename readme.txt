ALToke - Plataforma de materiales de construcción (Frontend + APIs Flask)

1) Descripción general
- Frontend estático en HTML/CSS/JS.
- Backend formado por microservicios Flask que leen/escriben un JSON (fake_db.json).
- Integración por CORS y fetch desde el frontend a localhost (puertos distintos).

2) Estructura de carpetas
Altoke 0.06/
├─ index.html                 (Home)
├─ productos.html             (Listado de productos - usa filtros por categoría, búsqueda y proveedor)
├─ proveedores.html           (Listado de proveedores + registro)
├─ carrito.html               (Carrito y checkout)
├─ login.html                 (Login/Registro de usuarios)
├─ perfil.html                (Historial y gestión de pedidos)
├─ contactos.html             (Contacto)
├─ buscar.html                (Resultados de búsqueda)
├─ estilos/
│  └─ css/
│     └─ s-inicio.css        (Estilos globales)
├─ javita/
│  ├─ main.js                 (Utilidades y componentes comunes)
│  ├─ auth.js                 (Manejo de autenticación en el frontend)
│  ├─ carrito.js              (Gestión del carrito desde frontend)
│  ├─ productos.js            (Carga y rendering de productos, filtros y favoritos)
│  ├─ proveedores.js          (Registro de proveedor y filtros de proveedores)
│  └─ contacto.js             (Envío del formulario de contacto)
├─ python_version/
│  ├─ auth.py                 (Servicio de autenticación - puerto 5002)
│  ├─ register.py             (Registro de usuario - puerto 5001)
│  ├─ productos.py            (API de productos con filtros - puerto 5000)
│  ├─ carrito.py              (Carrito y pedidos - puerto 5003)
│  ├─ fake_db.json            (Base de datos simulada)
│  ├─ db_config.py            (Config MySQL para pruebas, no requerido para JSON)
│  └─ test_db.py              (Prueba de conexión a MySQL opcional)
└─ databeis/
   └─ scripts sql.sql         (DDL/índices ejemplo para BD real)

3) Requisitos
- Python 3.10+ (recomendado 3.11).
- Pip.
- Navegador moderno.
- Paquetes Python:
  - Flask
  - flask-cors
  - pymysql (solo si usará test_db.py o BD real)

4) Instalación (Windows)
- Abrir PowerShell o CMD en: c:\Users\Admin\OneDrive\Escritorio\Altoke 0.06
- Crear entorno virtual (opcional pero recomendado):
  python -m venv .venv
  .\.venv\Scripts\activate
- Instalar dependencias:
  pip install Flask flask-cors pymysql

5) Cómo iniciar los microservicios (cada uno en una terminal separada)
- Servicio de productos (puerto 5000):
  cd "c:\Users\Admin\OneDrive\Escritorio\Altoke 0.06\python_version"
  python productos.py
  Endpoints:
  - GET /productos?search=...&categoria=...&proveedor=...

- Servicio de registro (puerto 5001):
  cd "c:\Users\Admin\OneDrive\Escritorio\Altoke 0.06\python_version"
  python register.py
  Endpoints:
  - POST /register  JSON: {name, email, phone (opcional), password}

- Servicio de auth (puerto 5002):
  cd "c:\Users\Admin\OneDrive\Escritorio\Altoke 0.06\python_version"
  python auth.py
  Endpoints:
  - POST /auth       JSON: {email, password} -> token (base64)
  Notas: Token no es JWT; es un base64 con exp. Uso educativo.

- Servicio de carrito/pedidos (puerto 5003):
  cd "c:\Users\Admin\OneDrive\Escritorio\Altoke 0.06\python_version"
  python carrito.py
  Endpoints (requieren Authorization: Bearer <token>):
  - GET/POST/PUT/DELETE /carrito
  - GET/POST /pedidos
  - DELETE /pedidos/<id>            (cancelar o eliminar con ?hard=true)
  - POST   /pedidos/<id>/reorden    (reagrega items del pedido al carrito)

6) Servir el frontend (recomendado servidor local)
El frontend usa rutas absolutas como /javita/...; sirva la carpeta raíz del proyecto.

Opciones:
- Opción 1 (Python http.server):
  cd "c:\Users\Admin\OneDrive\Escritorio\Altoke 0.06"
  python -m http.server 5500
  Abrir: http://localhost:5500/
- Opción 2 (VSCode Live Server):
  Abrir carpeta del proyecto y ejecutar Live Server en la raíz.

7) Flujo básico (prueba manual)
- Registrar usuario:
  POST http://localhost:5001/register
  Body JSON: {"name":"Admin","email":"admin@altoke.com","phone":"0991...","password":"admin123"}
  Respuesta: {success:true}
- Autenticar:
  POST http://localhost:5002/auth
  Body JSON: {"email":"admin@altoke.com","password":"admin123"}
  Copiar token devuelto.
- Navegar a http://localhost:5500/ e iniciar sesión desde login.html (el frontend guardará el token).
- Ver productos:
  http://localhost:5500/productos.html
  Filtros soportados:
   - ?categoria=materiales-basicos|acabados|herramientas|electricidad|fontaneria|otros
   - ?search=palabra
   - ?proveedor=ConstruMax (o cualquier proveedor del fake_db.json)
  Ejemplos:
   - /productos.html?proveedor=ConstruMax
   - /productos.html?categoria=acero
- Agregar al carrito desde tarjetas (requiere login).
- Ir a /carrito.html para ver/editar cantidades y hacer checkout (crea pedido en /pedidos del servicio 5003).
- Ver pedidos en /perfil.html (GET /pedidos).

8) Datos iniciales (fake_db.json)
- Ubicación: python_version/fake_db.json
- Estructuras relevantes:
  usuarios: [{id, nombre, email, password, telefono}]
  productos: [{
    id_producto, nombre, descripcion, precio, precio_original, imagen,
    stock, proveedor, categoria
  }]
  carritos: [{id_usuario, items:[{id_item, id_producto, cantidad}]}]
  pedidos: [{
    id, id_usuario, date, status, items:[{id_producto, nombre, imagen, proveedor, precio, cantidad}],
    shipping_cost, discount, subtotal, total
  }]
- Edite este archivo para cargar productos/usuarios de prueba. Los servicios persisten cambios ahí.

9) Páginas del frontend (mapa rápido)
- index.html
  - Sección “Proveedores Destacados” enlaza a productos filtrados por ?proveedor=...
  - Estadísticas con animación.
- productos.html
  - Lista dinámica desde http://localhost:5000/productos
  - Lee ?search, ?categoria, ?proveedor y ajusta el título.
- proveedores.html
  - Tarjetas de proveedores; botón “Ver Productos” filtra por ?proveedor=...
  - Formulario de “Registro de Proveedor” (demo: POST /proveedor/registro no implementado en backend real).
- carrito.html
  - Requiere login. Opera contra http://localhost:5003/carrito y crea pedidos en /pedidos.
- login.html
  - Login contra http://localhost:5002/auth
  - Registro de usuarios contra http://localhost:5001/register
- perfil.html
  - Lista pedidos del usuario (GET http://localhost:5003/pedidos)
  - Permite cancelar, eliminar y reordenar.
- contactos.html
  - Formulario de contacto (frontend preparado; endpoint /contacto no implementado en backend demo).

10) APIs principales (resumen)
- Productos (5000)
  GET /productos
  Query:
   - search (o q)
   - categoria
   - proveedor
  Respuesta: {success, productos:[...]}

- Auth (5002)
  POST /auth
  Body: {email, password}
  Respuesta: {success, token, user:{id, nombre, email}}

- Registro (5001)
  POST /register
  Body: {name, email, phone?, password}
  Respuesta: {success}

- Carrito/Pedidos (5003) [Requiere token]
  GET /carrito
  POST /carrito           {productoId, cantidad}
  PUT /carrito            {itemId, nuevaCantidad}
  DELETE /carrito         {itemId?} (vacía si no se envía itemId)
  GET /pedidos
  POST /pedidos           (checkout; crea pedido desde carrito)
  DELETE /pedidos/{id}    (?hard=true elimina definitivamente; sin hard cancela)
  POST /pedidos/{id}/reorden

Headers comunes protegidos:
  Authorization: Bearer <token>

11) Notas importantes
- Token de auth es base64 con exp; no usar en producción.
- CORS habilitado en todos los servicios Flask para entorno local.
- Mantenga las rutas del frontend sirviendo la raíz del proyecto para que funcionen las rutas absolutas (/javita, /estilos, etc.).
- Íconos: Font Awesome 6.4.0 CDN.
- Imágenes de productos/proveedores provienen de URLs públicas/controladas.

12) Solución de problemas
- CORS/Origen cruzado:
  - Sirva el frontend con http.server o Live Server (no como file://).
  - Asegure que los servicios estén corriendo en 5000/5001/5002/5003.
- 401 “No autenticado”:
  - Inicie sesión en /login.html; el frontend guarda token en localStorage.
  - Token expira a 1 hora; vuelva a iniciar sesión si es necesario.
- 404/500 en APIs:
  - Verifique consola de cada servicio Flask (terminal).
  - Verifique que fake_db.json es válido (JSON correcto).
- Contador de carrito no aparece:
  - Requiere login; si no hay sesión, el contador se oculta.
- No carga imágenes:
  - Verifique la URL en fake_db.json o reemplace por un placeholder.

13) Desarrollo (recomendaciones)
- Usar entorno virtual por servicio o uno común en la carpeta python_version.
- Ejecutar servicios con debug=True (ya configurado) mientras desarrolla.
- Hacer backup de python_version/fake_db.json regularmente.

14) Roadmap (opcional)
- Migrar a JWT real.
- Persistencia en MySQL usando db_config.py y scripts SQL.
- Implementar endpoint real /proveedor/registro y /contacto.
- Paginación y cache de /productos.

15) Créditos
- Autoría del proyecto: ALToke.
- Este README fue generado para documentar configuración y ejecución local.
