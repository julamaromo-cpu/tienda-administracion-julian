# Lumen — tienda virtual

Tienda de tecnología construida con Next.js, Tailwind CSS y MySQL. Incluye catálogo con filtros y búsqueda, carrito de compras y registro de pedidos con control de existencias. El checkout guarda pedidos; no procesa pagos en línea.

## Requisitos

- Node.js 20.9 o posterior
- MySQL 8 o posterior, iniciado localmente

## Preparar MySQL

1. Inicia el servicio local de MySQL.
2. Desde la raíz del proyecto, importa el esquema y el catálogo de demostración:

   ```powershell
   Get-Content .\database\init.sql | mysql -u root -p
   ```

3. Crea la configuración local y agrega la contraseña de tu usuario MySQL:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   `DATABASE_URL` debe apuntar a `tienda_virtual`. Si la contraseña contiene caracteres especiales, codifícala para URL (por ejemplo, `@` como `%40`).

## Ejecutar la tienda

```powershell
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Para detener el servidor, usa `Ctrl+C` en la terminal.

## Verificación

```powershell
npm run lint
npm run build
```

## API

- `GET /api/products`: consulta los productos activos de MySQL.
- `POST /api/orders`: valida los datos, verifica y descuenta existencias y guarda el pedido y sus artículos en una transacción.

El esquema y los productos iniciales están en `database/init.sql`. Los datos de conexión se leen del servidor desde `.env.local`; nunca se exponen al navegador.
