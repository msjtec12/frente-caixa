import { create } from "zustand";

interface CartItem {
  product: any;
  quantity: number;
}

interface Payment {
  method: string;
  amount: number;
}

interface CartState {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (categoryId: string) => void;

  cart: CartItem[];
  discount: number;
  setDiscount: (discount: number) => void;
  addToCart: (product: any, quantity?: number) => void;
  updateQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (isOpen: boolean) => void;
  payments: Payment[];
  selectedMethod: string;
  setSelectedMethod: (method: string) => void;
  paymentAmount: number;
  setPaymentAmount: (amount: number) => void;
  addPayment: () => void;
  addQuickCash: (amount: number) => void;
  removePayment: (index: number) => void;
  clearPayments: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  searchTerm: "",
  setSearchTerm: (term) => set({ searchTerm: term }),
  
  selectedCategory: "all",
  setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),

  cart: [],
  discount: 0,
  setDiscount: (discount) => set({ discount }),

  addToCart: (product, qty = 1) => set((state) => {
    const existing = state.cart.find(item => item.product.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    
    if (currentQty + qty > product.stock) {
      alert(`Estoque insuficiente! Apenas ${product.stock} disponíveis.`);
      return state;
    }

    if (existing) {
      return {
        cart: state.cart.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + qty } : item
        ),
        searchTerm: ""
      };
    }
    return { cart: [...state.cart, { product, quantity: qty }], searchTerm: "" };
  }),

  updateQuantity: (productId, delta) => set((state) => ({
    cart: state.cart.map(item => {
      if (item.product.id === productId) {
        const newQtd = Math.max(1, item.quantity + delta);
        if (newQtd > item.product.stock) {
          alert(`Estoque insuficiente! Apenas ${item.product.stock} disponíveis.`);
          return item;
        }
        return { ...item, quantity: newQtd };
      }
      return item;
    })
  })),

  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter(item => item.product.id !== productId)
  })),

  clearCart: () => set({ cart: [], discount: 0, payments: [], paymentAmount: 0 }),

  isCheckoutOpen: false,
  setIsCheckoutOpen: (isOpen) => set({ isCheckoutOpen: isOpen }),

  payments: [],
  selectedMethod: "DINHEIRO",
  setSelectedMethod: (method) => set({ selectedMethod: method }),
  
  paymentAmount: 0,
  setPaymentAmount: (amount) => set({ paymentAmount: amount }),

  addPayment: () => set((state) => {
    if (state.paymentAmount <= 0) return state;
    return {
      payments: [...state.payments, { method: state.selectedMethod, amount: state.paymentAmount }],
      paymentAmount: 0
    };
  }),

  addQuickCash: (amount) => set((state) => ({
    payments: [...state.payments, { method: "DINHEIRO", amount }]
  })),

  removePayment: (index) => set((state) => ({
    payments: state.payments.filter((_, i) => i !== index)
  })),

  clearPayments: () => set({ payments: [], paymentAmount: 0 })
}));
