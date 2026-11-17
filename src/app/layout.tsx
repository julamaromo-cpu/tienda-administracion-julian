import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumen | Tecnología para vivir mejor",
  description: "Descubre tecnología seleccionada para trabajar, crear y desconectarte.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
