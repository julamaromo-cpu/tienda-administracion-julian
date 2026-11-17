"use client";

import {
  ArrowDown,
  ArrowRight,
  Check,
  Headphones,
  Laptop,
  LoaderCircle,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Truck,
  Watch,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

type Product = {
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
  featured: boolean;
};

type CartLine = { product: Product; quantity: number };

const categories = ["Todo", "Audio", "Computación", "Celulares", "Accesorios", "Wearables"];
const productIcons: Record<string, LucideIcon> = {
  headphones: Headphones,
  laptop: Laptop,
  smartphone: Smartphone,
  watch: Watch,
};
const accentStyles: Record<string, { panel: string; icon: string }> = {
  lavender: { panel: "from-[#eee8ff] to-[#ddd2ff]", icon: "text-[#7160b5]" },
  peach: { panel: "from-[#ffe9dc] to-[#ffd5c1]", icon: "text-[#c8784e]" },
  blue: { panel: "from-[#e2f0ff] to-[#cde4ff]", icon: "text-[#517ea9]" },
  mint: { panel: "from-[#e0f3ea] to-[#cce9d9]", icon: "text-[#4d8c6c]" },
  pink: { panel: "from-[#ffe6ef] to-[#f8d1e0]", icon: "text-[#b75e83]" },
};

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [activeCategory, setActiveCategory] = useState("Todo");
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");

  const fetchProducts = useCallback(async () => {
      const response = await fetch("/api/products");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo cargar el catálogo.");
      return data.products as Product[];
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setProducts(await fetchProducts());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "No se pudo conectar con la tienda.");
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  useEffect(() => {
    let active = true;
    fetchProducts()
      .then((loadedProducts) => {
        if (active) setProducts(loadedProducts);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : "No se pudo conectar con la tienda.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchProducts]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es-MX");
    return products.filter((product) => {
      const matchesCategory = activeCategory === "Todo" || product.category === activeCategory;
      const matchesSearch =
        !query ||
        `${product.name} ${product.category} ${product.description}`
          .toLocaleLowerCase("es-MX")
          .includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, products, search]);

  const cartCount = cart.reduce((total, line) => total + line.quantity, 0);
  const subtotal = cart.reduce((total, line) => total + line.product.price * line.quantity, 0);

  function addToCart(product: Product) {
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return current;
        return current.map((line) =>
          line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return product.stock > 0 ? [...current, { product, quantity: 1 }] : current;
    });
  }

  function changeQuantity(productId: number, change: number) {
    setCart((current) =>
      current
        .map((line) => {
          if (line.product.id !== productId) return line;
          return { ...line, quantity: Math.min(line.product.stock, line.quantity + change) };
        })
        .filter((line) => line.quantity > 0),
    );
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setCheckoutError("");
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim(),
      items: cart.map(({ product, quantity }) => ({ productId: product.id, quantity })),
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo registrar tu pedido.");
      setOrderNumber(data.orderNumber);
      setCart([]);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "No se pudo registrar tu pedido.");
    } finally {
      setSubmitting(false);
    }
  }

  function closeCheckout() {
    setCheckoutOpen(false);
    setOrderNumber("");
    setCheckoutError("");
  }

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#20211f]">
      <div className="bg-[#242320] px-4 py-2.5 text-center text-[11px] font-medium tracking-[0.12em] text-white sm:text-xs">
        <span className="inline-flex items-center gap-2">
          <Truck size={14} strokeWidth={1.8} />
          ENVÍO GRATIS EN COMPRAS MAYORES A $1,499
        </span>
      </div>

      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-[#fbfaf8]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] max-w-[1320px] items-center justify-between gap-5 px-5 lg:px-10">
          <a href="#" className="flex items-center gap-2.5" aria-label="Lumen, inicio">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d8f16d] text-[#303722]">
              <Zap size={19} fill="currentColor" strokeWidth={2.2} />
            </span>
            <span className="text-[19px] font-bold tracking-[0.13em]">LUMEN<span className="text-[#90968b]">.</span></span>
          </a>

          <nav className="hidden items-center gap-9 text-[13px] font-medium text-[#686963] md:flex">
            <a className="transition hover:text-black" href="#catalogo">Tienda</a>
            <a className="transition hover:text-black" href="#beneficios">Nuestra promesa</a>
            <a className="transition hover:text-black" href="#newsletter">Novedades</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <label className="hidden h-10 items-center gap-2 rounded-full bg-[#f0efec] px-3.5 text-[#777872] sm:flex">
              <Search size={16} />
              <input
                aria-label="Buscar productos"
                className="w-28 bg-transparent text-xs text-[#20211f] outline-none placeholder:text-[#858680] md:w-36"
                onChange={(event) => setSearch(event.target.value)}
                onFocus={() => document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" })}
                placeholder="Buscar..."
                value={search}
              />
            </label>
            <button
              aria-label={`Abrir carrito, ${cartCount} productos`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-black/10 transition hover:bg-white"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag size={18} strokeWidth={1.7} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#d8f16d] px-1 text-[10px] font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1320px] items-center gap-8 px-5 pb-12 pt-8 sm:pt-12 md:grid-cols-[1.05fr_0.95fr] md:gap-10 md:px-10 md:pb-20 md:pt-14">
        <div className="order-2 pb-3 md:order-1 md:pb-0">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e5e9d8] bg-[#f4f6ed] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#59663d] sm:text-[11px]">
            <Sparkles size={13} /> Tecnología para vivir mejor
          </div>
          <h1 className="max-w-[620px] text-[clamp(2.8rem,6.6vw,5.7rem)] font-medium leading-[0.98] tracking-[-0.065em]">
            Menos ruido.
            <br />
            <span className="font-serif italic text-[#727b5d]">Más conexión.</span>
          </h1>
          <p className="mt-5 max-w-[430px] text-sm leading-7 text-[#777872] sm:mt-6 sm:text-base">
            Tecnología que se siente bien. Encuentra tus nuevos favoritos para trabajar, crear y desconectarte.
          </p>
          <a
            className="mt-7 inline-flex h-12 items-center gap-3 rounded-full bg-[#d8f16d] px-6 text-[13px] font-semibold transition hover:bg-[#cae75e] sm:mt-8"
            href="#catalogo"
          >
            Explorar colección <ArrowDown size={16} />
          </a>
          <div className="mt-9 flex items-center gap-3 text-xs text-[#777872] sm:mt-11">
            <div className="flex -space-x-2">
              {["#d2e8c8", "#f2d9c6", "#d9d4ef", "#f0d4da"].map((color, index) => (
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#fbfaf8] text-[10px] font-semibold text-[#4c4e47]"
                  key={color}
                  style={{ backgroundColor: color }}
                >
                  {["M", "A", "J", "L"][index]}
                </span>
              ))}
            </div>
            <span><strong className="font-semibold text-[#343530]">+2,400</strong> personas conectadas</span>
          </div>
        </div>

        <div className="hero-art order-1 flex min-h-[270px] items-center justify-center overflow-hidden rounded-[24px] md:order-2 md:min-h-[450px] md:rounded-[30px]">
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />
          <span className="hero-label">SOUND<br />WITHOUT<br />LIMITS</span>
          <div className="hero-headphones">
            <Headphones size={150} strokeWidth={1.05} />
          </div>
          <span className="hero-sparkle"><Sparkles size={22} /></span>
          <span className="hero-caption">TU MOMENTO.<br />TU ESPACIO.</span>
          <span className="hero-sticker"><span>NEW</span><strong>DROP<br />01 / 25</strong></span>
        </div>
      </section>

      <section className="border-y border-black/[0.06] bg-white/70" id="beneficios">
        <div className="mx-auto grid max-w-[1320px] grid-cols-1 divide-y divide-black/[0.06] px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 md:px-10">
          <div className="flex items-center gap-3 py-4 sm:justify-center sm:py-5">
            <Truck className="text-[#737c5c]" size={19} strokeWidth={1.7} />
            <span className="text-xs text-[#696a64]"><strong className="font-semibold text-[#30312d]">Envíos seguros</strong> · a todo México</span>
          </div>
          <div className="flex items-center gap-3 py-4 sm:justify-center sm:py-5">
            <ShieldCheck className="text-[#737c5c]" size={19} strokeWidth={1.7} />
            <span className="text-xs text-[#696a64]"><strong className="font-semibold text-[#30312d]">Compra protegida</strong> · 30 días de garantía</span>
          </div>
          <div className="flex items-center gap-3 py-4 sm:justify-center sm:py-5">
            <Headphones className="text-[#737c5c]" size={19} strokeWidth={1.7} />
            <span className="text-xs text-[#696a64]"><strong className="font-semibold text-[#30312d]">Estamos contigo</strong> · atención personal</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-5 py-14 md:px-10 md:py-20" id="catalogo">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4 md:mb-9">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a8b83]">Una selección para ti</p>
            <h2 className="text-3xl font-medium tracking-[-0.045em] sm:text-[40px]">Piezas que conectan.</h2>
          </div>
          <a className="hidden items-center gap-2 pb-1 text-xs font-medium text-[#66675f] transition hover:text-black sm:inline-flex" href="#productos">
            Ver colección <ArrowRight size={15} />
          </a>
        </div>

        <div className="mb-7 flex items-center gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Filtrar por categoría">
          {categories.map((category) => (
            <button
              aria-selected={activeCategory === category}
              className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-medium transition ${
                activeCategory === category
                  ? "bg-[#292a26] text-white"
                  : "border border-black/[0.09] bg-transparent text-[#72736d] hover:border-black/25 hover:text-black"
              }`}
              key={category}
              onClick={() => setActiveCategory(category)}
              role="tab"
            >
              {category}
            </button>
          ))}
          <label className="ml-auto flex h-10 min-w-36 items-center gap-2 rounded-full bg-[#f0efec] px-3.5 text-[#777872] sm:hidden">
            <Search size={15} />
            <input
              aria-label="Buscar productos"
              className="w-full bg-transparent text-xs text-[#20211f] outline-none placeholder:text-[#858680]"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar..."
              value={search}
            />
          </label>
        </div>

        {loading ? (
          <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-[#73746d]">
            <LoaderCircle className="animate-spin" size={20} /> Cargando la colección...
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-[#eadbd5] bg-[#fff9f6] px-5 py-10 text-center">
            <p className="text-sm font-semibold">No pudimos conectar con la tienda</p>
            <p className="mx-auto mt-2 max-w-lg text-xs leading-6 text-[#78736f]">{loadError} Revisa que MySQL esté iniciado y que DATABASE_URL esté configurada.</p>
            <button className="mt-4 rounded-full bg-[#292a26] px-5 py-2.5 text-xs font-medium text-white" onClick={() => void loadProducts()}>
              Intentar de nuevo
            </button>
          </div>
        ) : visibleProducts.length ? (
          <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-6" id="productos">
            {visibleProducts.map((product) => {
              const ProductIcon = productIcons[product.icon] ?? Laptop;
              const accent = accentStyles[product.accent] ?? accentStyles.lavender;
              const isInCart = cart.some((line) => line.product.id === product.id);
              return (
                <article className="group min-w-0" key={product.id}>
                  <div className={`product-art relative flex aspect-[0.91] items-center justify-center overflow-hidden rounded-[18px] bg-gradient-to-br ${accent.panel}`}>
                    {product.featured && (
                      <span className="absolute left-3.5 top-3.5 z-10 rounded-full bg-white/85 px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#56584e]">
                        Favorito
                      </span>
                    )}
                    {product.oldPrice && (
                      <span className="absolute right-3.5 top-3.5 z-10 rounded-full bg-[#d8f16d] px-2.5 py-1.5 text-[9px] font-semibold text-[#414735]">
                        -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                      </span>
                    )}
                    <span className={`product-halo ${accent.icon}`} />
                    <ProductIcon className={`product-icon ${accent.icon}`} size={104} strokeWidth={1.1} />
                    <button
                      aria-label={isInCart ? `${product.name} ya está en el carrito` : `Agregar ${product.name} al carrito`}
                      className={`absolute bottom-3.5 right-3.5 flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition ${
                        isInCart
                          ? "bg-[#d8f16d] text-[#343a28]"
                          : "translate-y-2 bg-white text-[#343530] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-[#d8f16d]"
                      }`}
                      onClick={() => addToCart(product)}
                    >
                      {isInCart ? <Check size={17} /> : <Plus size={18} />}
                    </button>
                  </div>
                  <div className="pt-3.5">
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] text-[#81827b]">
                      <span className="uppercase tracking-[0.1em]">{product.category}</span>
                      <span className="inline-flex items-center gap-1"><Star size={11} className="fill-[#d9ae52] text-[#d9ae52]" /> {product.rating} <span className="text-[#a2a29c]">({product.reviews})</span></span>
                    </div>
                    <h3 className="truncate text-sm font-medium">{product.name}</h3>
                    <p className="mt-1 truncate text-xs text-[#85867f]">{product.description}</p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="text-sm font-semibold">{formatPrice(product.price)}</span>
                      {product.oldPrice && <span className="text-xs text-[#9a9b94] line-through">{formatPrice(product.oldPrice)}</span>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-black/[0.07] px-5 py-14 text-center text-sm text-[#73746d]">
            No encontramos productos con esa búsqueda. Prueba otra categoría o palabra.
          </div>
        )}
      </section>

      <section className="mx-auto max-w-[1320px] px-5 pb-14 md:px-10 md:pb-20" id="newsletter">
        <div className="newsletter-art relative flex min-h-[210px] flex-col justify-center overflow-hidden rounded-[24px] px-7 py-9 sm:min-h-[250px] sm:px-12 md:px-16">
          <span className="absolute -right-6 -top-24 hidden h-72 w-72 rounded-full border border-white/10 md:block" />
          <span className="absolute -right-2 -top-14 hidden h-56 w-56 rounded-full border border-white/10 md:block" />
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d8f16d]">Una buena conexión empieza aquí</p>
          <h2 className="max-w-xl text-3xl font-medium tracking-[-0.045em] text-white sm:text-[40px]">Encuentra tu siguiente favorito.</h2>
          <a className="mt-5 inline-flex w-fit items-center gap-2 text-xs font-medium text-white/75 transition hover:text-white" href="#catalogo">
            Explora la tienda <ArrowRight size={15} />
          </a>
        </div>
      </section>

      <footer className="border-t border-black/[0.07]">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-3 px-5 py-6 text-[11px] text-[#85867f] sm:flex-row sm:items-center sm:justify-between md:px-10">
          <span className="font-semibold tracking-[0.13em] text-[#33342f]">LUMEN.</span>
          <span>Tecnología con intención. © {new Date().getFullYear()} Lumen Studio.</span>
          <span>Hecho para conectar mejor.</span>
        </div>
      </footer>

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button aria-label="Cerrar carrito" className="absolute inset-0 bg-black/35" onClick={() => setCartOpen(false)} />
          <aside aria-label="Tu carrito" aria-modal="true" className="relative flex h-full w-full max-w-[440px] flex-col bg-[#fbfaf8] shadow-2xl" role="dialog">
            <div className="flex items-center justify-between border-b border-black/[0.08] px-6 py-5">
              <div>
                <h2 className="text-lg font-medium">Tu carrito <span className="text-sm text-[#85867f]">({cartCount})</span></h2>
                <p className="mt-1 text-[11px] text-[#85867f]">Casi tienes algo increíble.</p>
              </div>
              <button aria-label="Cerrar carrito" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5" onClick={() => setCartOpen(false)}><X size={18} /></button>
            </div>
            {cart.length ? (
              <>
                <div className="flex-1 overflow-y-auto px-6">
                  {cart.map(({ product, quantity }) => {
                    const ProductIcon = productIcons[product.icon] ?? Laptop;
                    const accent = accentStyles[product.accent] ?? accentStyles.lavender;
                    return (
                      <div className="flex gap-4 border-b border-black/[0.07] py-5" key={product.id}>
                        <div className={`flex h-[84px] w-[84px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent.panel}`}>
                          <ProductIcon className={accent.icon} size={34} strokeWidth={1.2} />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                          <div>
                            <h3 className="truncate text-sm font-medium">{product.name}</h3>
                            <p className="mt-1 text-xs text-[#85867f]">{product.category}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button aria-label={`Quitar una unidad de ${product.name}`} className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10" onClick={() => changeQuantity(product.id, -1)}><Minus size={13} /></button>
                              <span className="w-4 text-center text-xs">{quantity}</span>
                              <button aria-label={`Agregar una unidad de ${product.name}`} className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 disabled:opacity-40" disabled={quantity >= product.stock} onClick={() => changeQuantity(product.id, 1)}><Plus size={13} /></button>
                            </div>
                            <span className="text-sm font-semibold">{formatPrice(product.price * quantity)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-black/[0.08] px-6 py-5">
                  <div className="mb-4 flex justify-between text-sm"><span className="text-[#777872]">Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
                  <p className="mb-4 text-[11px] leading-5 text-[#85867f]">El envío se coordina después de confirmar el pedido. No se realizará ningún cobro en línea.</p>
                  <button
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#d8f16d] text-sm font-semibold transition hover:bg-[#cae75e]"
                    onClick={() => {
                      setCartOpen(false);
                      setCheckoutOpen(true);
                    }}
                  >
                    Continuar pedido <ArrowRight size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f0efec] text-[#74756e]"><ShoppingBag size={25} strokeWidth={1.4} /></span>
                <h3 className="mt-5 text-base font-medium">Tu carrito está esperando</h3>
                <p className="mt-2 max-w-[240px] text-xs leading-5 text-[#85867f]">Explora la colección y agrega algo que te haga la vida más fácil.</p>
                <button className="mt-5 text-xs font-semibold underline underline-offset-4" onClick={() => setCartOpen(false)}>Seguir explorando</button>
              </div>
            )}
          </aside>
        </div>
      )}

      {checkoutOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div aria-label="Confirmar pedido" aria-modal="true" className="relative my-auto w-full max-w-[500px] rounded-[22px] bg-[#fbfaf8] p-6 shadow-2xl sm:p-8" role="dialog">
            <button aria-label="Cerrar" className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5" onClick={closeCheckout}><X size={18} /></button>
            {orderNumber ? (
              <div className="py-8 text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f4cd] text-[#52633b]"><Check size={28} /></span>
                <h2 className="mt-5 text-2xl font-medium tracking-tight">¡Pedido recibido!</h2>
                <p className="mt-2 text-sm leading-6 text-[#777872]">Tu número de pedido es <strong className="text-[#30312d]">#{orderNumber}</strong>. Nos pondremos en contacto para coordinar el envío.</p>
                <p className="mt-3 text-xs text-[#85867f]">Este pedido no genera ningún cobro en línea.</p>
                <button className="mt-6 h-11 rounded-full bg-[#d8f16d] px-6 text-xs font-semibold" onClick={closeCheckout}>Volver a la tienda</button>
              </div>
            ) : (
              <>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#85867f]">Un paso más</p>
                <h2 className="text-2xl font-medium tracking-[-0.04em]">¿A dónde lo enviamos?</h2>
                <p className="mt-2 pr-7 text-xs leading-5 text-[#85867f]">Déjanos tus datos para registrar tu pedido. El pago se coordina después; no cobramos en línea.</p>
                <div className="my-5 flex items-center justify-between rounded-xl bg-[#f0efec] px-4 py-3 text-xs">
                  <span className="text-[#777872]">{cartCount} {cartCount === 1 ? "producto" : "productos"}</span><strong>{formatPrice(subtotal)}</strong>
                </div>
                <form className="space-y-3.5" onSubmit={submitOrder}>
                  <label className="block text-xs font-medium">Nombre completo
                    <input autoComplete="name" className="form-input mt-1.5" maxLength={120} name="name" placeholder="Tu nombre" required />
                  </label>
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <label className="block text-xs font-medium">Correo electrónico
                      <input autoComplete="email" className="form-input mt-1.5" maxLength={254} name="email" placeholder="tu@correo.com" required type="email" />
                    </label>
                    <label className="block text-xs font-medium">Teléfono
                      <input autoComplete="tel" className="form-input mt-1.5" maxLength={30} name="phone" placeholder="55 1234 5678" required type="tel" />
                    </label>
                  </div>
                  <label className="block text-xs font-medium">Dirección de entrega
                    <textarea autoComplete="street-address" className="form-input mt-1.5 min-h-20 resize-y" maxLength={500} name="address" placeholder="Calle, número, colonia, ciudad y código postal" required />
                  </label>
                  {checkoutError && <p className="rounded-lg bg-[#fff0eb] px-3 py-2.5 text-xs leading-5 text-[#a14835]" role="alert">{checkoutError}</p>}
                  <button className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#d8f16d] text-sm font-semibold transition hover:bg-[#cae75e] disabled:cursor-wait disabled:opacity-70" disabled={submitting || !cart.length} type="submit">
                    {submitting ? <><LoaderCircle className="animate-spin" size={16} /> Registrando...</> : <>Confirmar pedido <ArrowRight size={16} /></>}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
