import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import { getPool } from "@/lib/db";

type RequestedItem = { productId: number; quantity: number };
type OrderRequest = {
  name: string;
  email: string;
  phone: string;
  address: string;
  items: RequestedItem[];
};

interface OrderProduct extends RowDataPacket {
  id: number;
  name: string;
  price: number;
  stock: number;
}

function isOrderRequest(value: unknown): value is OrderRequest {
  if (!value || typeof value !== "object") return false;
  const order = value as Record<string, unknown>;
  if (
    typeof order.name !== "string" ||
    order.name.trim().length < 2 ||
    order.name.trim().length > 120 ||
    typeof order.email !== "string" ||
    order.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email) ||
    typeof order.phone !== "string" ||
    order.phone.trim().length < 7 ||
    order.phone.trim().length > 30 ||
    typeof order.address !== "string" ||
    order.address.trim().length < 10 ||
    order.address.trim().length > 500 ||
    !Array.isArray(order.items) ||
    order.items.length < 1 ||
    order.items.length > 20
  ) {
    return false;
  }

  return order.items.every(
    (item) =>
      item !== null &&
      typeof item === "object" &&
      Number.isInteger(item.productId) &&
      item.productId > 0 &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0 &&
      item.quantity <= 99,
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud debe ser JSON válido." }, { status: 400 });
  }

  if (!isOrderRequest(body)) {
    return NextResponse.json({ error: "Revisa tus datos de contacto y los productos del pedido." }, { status: 400 });
  }

  const quantities = new Map<number, number>();
  for (const item of body.items) {
    const total = (quantities.get(item.productId) ?? 0) + item.quantity;
    if (total > 99) {
      return NextResponse.json({ error: "La cantidad máxima por producto es 99 unidades." }, { status: 400 });
    }
    quantities.set(item.productId, total);
  }

  let connection: PoolConnection | undefined;

  try {
    connection = await getPool().getConnection();
    await connection.beginTransaction();
    const productIds = [...quantities.keys()];
    const [products] = await connection.query<OrderProduct[]>(
      "SELECT id, name, price, stock FROM products WHERE is_active = 1 AND id IN (?) FOR UPDATE",
      [productIds],
    );

    if (products.length !== productIds.length) {
      await connection.rollback();
      return NextResponse.json({ error: "Uno o más productos ya no están disponibles." }, { status: 409 });
    }

    for (const product of products) {
      const quantity = quantities.get(product.id) ?? 0;
      if (quantity > product.stock) {
        await connection.rollback();
        return NextResponse.json(
          { error: `No hay suficientes unidades disponibles de ${product.name}.` },
          { status: 409 },
        );
      }
    }

    const total = products.reduce(
      (sum, product) => sum + Number(product.price) * (quantities.get(product.id) ?? 0),
      0,
    );
    const [orderResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO orders (customer_name, email, phone, shipping_address, total, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [body.name.trim(), body.email.trim().toLowerCase(), body.phone.trim(), body.address.trim(), total],
    );

    for (const product of products) {
      const quantity = quantities.get(product.id) ?? 0;
      await connection.execute(
        "INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity) VALUES (?, ?, ?, ?, ?)",
        [orderResult.insertId, product.id, product.name, product.price, quantity],
      );
      await connection.execute("UPDATE products SET stock = stock - ? WHERE id = ?", [quantity, product.id]);
    }

    await connection.commit();
    return NextResponse.json(
      { orderNumber: String(orderResult.insertId).padStart(6, "0"), total },
      { status: 201 },
    );
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Could not roll back failed order transaction:", rollbackError);
      }
    }
    console.error("Could not save order to MySQL:", error);
    return NextResponse.json(
      { error: "No se pudo guardar el pedido. Comprueba que MySQL esté disponible y vuelve a intentarlo." },
      { status: 503 },
    );
  } finally {
    connection?.release();
  }
}
