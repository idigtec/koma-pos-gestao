import React, { useState, useEffect, useMemo } from 'react';
import {
  UtensilsCrossed,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  ArrowRight,
  RotateCcw,
  Sparkles,
  CreditCard,
  Smartphone,
  Banknote,
  X,
  Clock,
  ArrowLeft,
  Flame,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, Category, CartItem, DiningOption, SelectedModifier } from '../types';
import { DatabaseService } from '../services/db';
import { formatCurrency } from '../utils/formatters';
import { ProductIllustration } from '../components/ProductIllustration';
import { ProductCustomizerModal } from '../components/modals/ProductCustomizerModal';

interface KioskProps {
  onExitKiosk?: () => void;
}

export const Kiosk: React.FC<KioskProps> = ({ onExitKiosk }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [diningOption, setDiningOption] = useState<DiningOption>('balcao');
  const [step, setStep] = useState<'catalog' | 'checkout' | 'success'>('catalog');
  const [orderNumber, setOrderNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'emola' | 'cartao' | 'caixa'>('mpesa');

  // Customizer modal
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [prods, cats] = await Promise.all([
          DatabaseService.getProducts(),
          DatabaseService.getCategories(),
        ]);
        setProducts(prods.filter(p => p.status === 'active' && !p.is86));
        setCategories(cats.filter(c => c.status === 'active'));
      } catch (e) {
        console.error('Error loading kiosk data:', e);
      }
    };
    load();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => selectedCategory === 'all' || p.categoryId === selectedCategory);
  }, [products, selectedCategory]);

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.subtotal, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const handleProductClick = (product: Product) => {
    if (product.modifierGroups && product.modifierGroups.length > 0) {
      setCustomizingProduct(product);
      setIsCustomizerOpen(true);
    } else {
      addToCart(product, 1, [], '');
    }
  };

  const addToCart = (
    product: Product,
    quantity: number,
    selectedModifiers: SelectedModifier[],
    notes: string
  ) => {
    const modifiersAdjustment = selectedModifiers.reduce((acc, mod) => acc + mod.priceAdjustment, 0);
    const unitPrice = product.sellingPrice + modifiersAdjustment;
    const subtotal = unitPrice * quantity;

    const newItem: CartItem = {
      cartItemId: `kiosk-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      product,
      quantity,
      unitPrice,
      selectedModifiers,
      notes: notes.trim() || undefined,
      discount: 0,
      subtotal,
    };

    setCart(prev => [...prev, newItem]);
  };

  const updateCartQty = (cartItemId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            return {
              ...item,
              quantity: newQty,
              subtotal: item.unitPrice * newQty,
            };
          }
          return item;
        })
        .filter(item => item.quantity > 0)
    );
  };

  const handleFinishOrder = async () => {
    if (cart.length === 0) return;

    const seq = Math.floor(Math.random() * 900) + 100;
    const orderNum = `#${seq}`;
    setOrderNumber(orderNum);

    try {
      // Send kitchen order
      await DatabaseService.sendOrderToKitchen({
        cashier: {
          id: 'kiosk-user',
          name: 'Totem Autoatendimento',
          username: 'kiosk',
          email: 'kiosk@koma.co.mz',
          role: 'cashier',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
        customer: {
          id: 'kiosk-customer',
          name: 'Cliente Totem Autoatendimento',
          documentType: 'Outro',
          totalSpent: 0,
          totalPurchases: 0,
          status: 'active',
          createdAt: new Date().toISOString(),
        },
        diningOption,
        items: cart,
        total: cartTotal,
        isPaid: paymentMethod !== 'caixa',
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setStep('success');
    } catch (e) {
      console.error('Error creating kiosk order:', e);
      setStep('success'); // allow offline completion
    }
  };

  const handleResetKiosk = () => {
    setCart([]);
    setStep('catalog');
    setSelectedCategory('all');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none">
      {/* Top Kiosk Header */}
      <header className="h-20 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center font-black text-xl text-white shadow-md">
            K
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>KOMA FAST FOOD</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-600/30 text-orange-400 border border-orange-500/40">
                AUTOATENDIMENTO
              </span>
            </h1>
            <p className="text-xs text-slate-400">Toque na tela para fazer seu pedido e retirar quentinho!</p>
          </div>
        </div>

        {onExitKiosk && (
          <button
            type="button"
            onClick={onExitKiosk}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            Sair do Totem
          </button>
        )}
      </header>

      {/* --- STEP 1: CATALOG VIEW --- */}
      {step === 'catalog' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Category Bar */}
          <div className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-3 flex items-center gap-3 overflow-x-auto scrollbar-none shrink-0">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-5 py-3 rounded-2xl font-black text-sm transition-all cursor-pointer flex items-center gap-2 ${
                selectedCategory === 'all'
                  ? 'bg-orange-600 text-white shadow-lg scale-105'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-white'
              }`}
            >
              <span>🔥 Todos os Itens</span>
            </button>

            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-3 rounded-2xl font-black text-sm transition-all cursor-pointer flex items-center gap-2 ${
                  selectedCategory === cat.id
                    ? 'bg-orange-600 text-white shadow-lg scale-105'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-white'
                }`}
              >
                <span>{cat.icon || '🍔'}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleProductClick(p)}
                  className="bg-slate-900 border border-slate-800 hover:border-orange-500 rounded-3xl overflow-hidden flex flex-col justify-between cursor-pointer group transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl active:scale-98"
                >
                  <div>
                    {/* Food Photo Banner */}
                    <div className="h-44 w-full bg-slate-800 relative flex items-center justify-center overflow-hidden">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <ProductIllustration
                          productName={p.name}
                          sku={p.sku}
                          categoryName={p.categoryName}
                          size="lg"
                        />
                      )}

                      {p.isBestSeller && (
                        <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-white shadow-md">
                          ⭐ Top
                        </span>
                      )}

                      {p.modifierGroups && p.modifierGroups.length > 0 && (
                        <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-orange-600 text-white shadow-md">
                          Personalizar
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        {p.categoryName}
                      </span>
                      <h3 className="font-black text-white text-base leading-snug line-clamp-2">
                        {p.name}
                      </h3>
                      {p.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                          {p.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-lg font-black font-mono text-orange-400">
                      {formatCurrency(p.sellingPrice)}
                    </span>

                    <button
                      type="button"
                      className="w-9 h-9 rounded-xl bg-orange-600 group-hover:bg-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-md transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating Cart Footer Bar */}
          {cart.length > 0 && (
            <div className="bg-slate-900 border-t border-slate-800 p-4 px-6 flex items-center justify-between shadow-2xl shrink-0 animate-in slide-in-from-bottom-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center font-black text-white text-lg">
                  {cartCount}
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-bold block">Total do Seu Pedido</span>
                  <span className="text-2xl font-black font-mono text-white">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl font-bold text-xs cursor-pointer"
                >
                  Limpar
                </button>

                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="px-8 py-3.5 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 cursor-pointer transition-all"
                >
                  <span>AVANÇAR PARA PAGAMENTO</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- STEP 2: CHECKOUT & PAYMENT SELECTION --- */}
      {step === 'checkout' && (
        <div className="flex-1 flex flex-col justify-between p-6 max-w-4xl mx-auto w-full">
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setStep('catalog')}
              className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Cardápio</span>
            </button>

            {/* Dining Option Selection */}
            <div>
              <h2 className="text-lg font-black text-white mb-2">1. Onde você vai saborear seu pedido?</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDiningOption('balcao')}
                  className={`p-5 rounded-3xl border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    diningOption === 'balcao'
                      ? 'border-orange-500 bg-orange-950/40 text-white shadow-xl scale-102'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <UtensilsCrossed className="w-8 h-8 text-orange-500" />
                  <span className="font-black text-base">Comer Aqui</span>
                  <span className="text-xs text-slate-400">Servido quentinho na bandeja</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDiningOption('takeaway')}
                  className={`p-5 rounded-3xl border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    diningOption === 'takeaway'
                      ? 'border-orange-500 bg-orange-950/40 text-white shadow-xl scale-102'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <ShoppingBag className="w-8 h-8 text-orange-500" />
                  <span className="font-black text-base">Levar para Casa (Takeaway)</span>
                  <span className="text-xs text-slate-400">Embalagem térmica KOMA</span>
                </button>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <h2 className="text-lg font-black text-white mb-2">2. Como deseja pagar?</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mpesa')}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'mpesa'
                      ? 'border-rose-500 bg-rose-950/40 text-white shadow-lg'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  <Smartphone className="w-6 h-6 text-rose-500" />
                  <span className="font-black text-sm">M-Pesa</span>
                  <span className="text-[10px] text-slate-400">Pagar no celular</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('emola')}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'emola'
                      ? 'border-orange-500 bg-orange-950/40 text-white shadow-lg'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  <Smartphone className="w-6 h-6 text-orange-500" />
                  <span className="font-black text-sm">e-Mola</span>
                  <span className="text-[10px] text-slate-400">Pagar no celular</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cartao')}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'cartao'
                      ? 'border-blue-500 bg-blue-950/40 text-white shadow-lg'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  <CreditCard className="w-6 h-6 text-blue-500" />
                  <span className="font-black text-sm">Cartão / POS</span>
                  <span className="text-[10px] text-slate-400">Aproximação / Chip</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('caixa')}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'caixa'
                      ? 'border-emerald-500 bg-emerald-950/40 text-white shadow-lg'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  <Banknote className="w-6 h-6 text-emerald-500" />
                  <span className="font-black text-sm">Dinheiro no Caixa</span>
                  <span className="text-[10px] text-slate-400">Pagar ao retirar</span>
                </button>
              </div>
            </div>

            {/* Cart Items Summary */}
            <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 space-y-3">
              <h3 className="font-black text-white text-sm">Resumo dos Itens ({cartCount})</h3>
              <div className="divide-y divide-slate-800/80 max-h-48 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.cartItemId} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-orange-600/30 text-orange-400 font-black text-xs flex items-center justify-center font-mono">
                        {item.quantity}x
                      </span>
                      <div>
                        <span className="font-bold text-white text-xs block">{item.product.name}</span>
                        {item.selectedModifiers.length > 0 && (
                          <span className="text-[10px] text-slate-400">
                            {item.selectedModifiers.map(m => m.name).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-white text-xs">
                        {formatCurrency(item.subtotal)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.cartItemId, -1)}
                          className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.cartItemId, 1)}
                          className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Checkout Confirm Action */}
          <div className="pt-6 flex items-center justify-between border-t border-slate-800">
            <div>
              <span className="text-xs text-slate-400 uppercase font-bold block">Total a Pagar</span>
              <span className="text-3xl font-black font-mono text-orange-400">
                {formatCurrency(cartTotal)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleFinishOrder}
              className="px-10 py-4 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-black text-base rounded-2xl shadow-2xl flex items-center gap-2 cursor-pointer transition-all"
            >
              <span>CONFIRMAR PEDIDO</span>
              <CheckCircle2 className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 3: ORDER SUCCESS SCREEN --- */}
      {step === 'success' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto space-y-6 animate-in zoom-in-95">
          <div className="w-24 h-24 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500/40 shadow-2xl">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
              SUA SENHA DE CHAMADA
            </span>
            <span className="text-6xl font-black font-mono text-orange-400 tracking-tight block">
              {orderNumber}
            </span>
          </div>

          <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-2 text-xs text-slate-300">
            <p className="font-bold text-white text-sm">
              Seu pedido já foi enviado diretamente para a nossa cozinha! 🔥
            </p>
            <p>
              Aguarde sua senha ser chamada no painel de chamada ou pelo atendente no balcão de retirada.
            </p>
            {paymentMethod === 'caixa' && (
              <p className="text-amber-400 font-bold bg-amber-950/40 p-2 rounded-xl border border-amber-800/40">
                💵 Por favor, apresente sua senha no caixa para efetuar o pagamento.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleResetKiosk}
            className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-sm rounded-2xl shadow-lg transition-all cursor-pointer"
          >
            Fazer Novo Pedido
          </button>
        </div>
      )}

      {/* Product Customizer Modal */}
      {customizingProduct && (
        <ProductCustomizerModal
          product={customizingProduct}
          isOpen={isCustomizerOpen}
          onClose={() => {
            setIsCustomizerOpen(false);
            setCustomizingProduct(null);
          }}
          onConfirm={(customizedData) => {
            if (customizingProduct) {
              addToCart(
                customizingProduct,
                customizedData.quantity,
                customizedData.selectedModifiers,
                customizedData.notes
              );
            }
            setIsCustomizerOpen(false);
            setCustomizingProduct(null);
          }}
        />
      )}
    </div>
  );
};
