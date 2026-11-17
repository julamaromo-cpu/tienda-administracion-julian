import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

interface ProductRow extends RowDataPacket {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  oldPrice: number | null;
  icon: string;
  accent: string;
  stock: number;
  rating: number;
  reviews: number;
  featured: number;
}

export async function GET() {
  try {
    const [products] = await getPool().query<ProductRow[]>(`
      SELECT
        id,
        name,
        category,
        description,
        price,
        old_price AS oldPrice,
        icon,
        accent,
        stock,
        rating,
        reviews,
        is_featured AS featured
      FROM products
      WHERE is_active = 1
      ORDER BY is_featured DESC, id ASC
    `);

    return NextResponse.json({
      products: products.map((product) => ({
        ...product,
        price: Number(product.price),
        oldPrice: product.oldPrice === null ? null : Number(product.oldPrice),
        rating: Number(product.rating),
        featured: Boolean(product.featured),
      })),
    });
  } catch (error) {
    console.error("Could not load products from MySQL:", error);
    return NextResponse.json(
      { error: "No se pudo acceder al catálogo. Verifica la conexión y que exista la tabla products." },
      { status: 503 },
    );
  }
}
