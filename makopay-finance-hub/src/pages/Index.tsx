import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from "@/contexts/AuthContext";
import SplashScreen from '@/components/makopay/SplashScreen';
import BottomNav from '@/components/makopay/BottomNav';
import AnimatedBackground from '@/components/makopay/AnimatedBackground';
import HomeScreen from '@/components/screens/HomeScreen';
import InvestScreen from '@/components/screens/InvestScreen';
import ShopScreen from '@/components/screens/ShopScreen';
import NetworkScreen from '@/components/screens/NetworkScreen';
import WalletScreen from '@/components/screens/WalletScreen';
import LoginScreen from '@/components/screens/LoginScreen';
import RegisterScreen from '@/components/screens/RegisterScreen';
import InvestmentDetailScreen from '@/components/screens/InvestmentDetailScreen';
import ProductDetailScreen from '@/components/screens/ProductDetailScreen';
import CheckoutScreen from '@/components/screens/CheckoutScreen';
import WithdrawScreen from '@/components/screens/WithdrawScreen';
import ProfileScreen from '@/components/screens/ProfileScreen';
import AddFundsScreen from '@/components/screens/AddFundsScreen';
import OrdersScreen from '@/components/screens/OrdersScreen';
import { toast } from 'sonner';
import TransactionDetailScreen from '@/components/screens/TransactionDetailScreen';

type Screen =
  | 'splash'
  | 'login'
  | 'register'
  | 'home'
  | 'invest'
  | 'shop'
  | 'network'
  | 'wallet'
  | 'investment-detail'
  | 'product-detail'
  | 'checkout'
  | 'withdraw'
  | 'profile'
  | 'addfunds'
  | 'orders'
  | 'transaction-detail';

interface Product {
  id: number;
  name: string;
  image: string;
  price: number;
  yield: number;
  duration: number;
  inStock: boolean;
}

const Index = () => {
  const { user, logout } = useAuth(); // Destructure logout
  const [currentScreen, setCurrentScreen] = useState<Screen>('home'); // Default to home since we are protected
  const [activeTab, setActiveTab] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<any>(null);
  const [checkoutQuantity, setCheckoutQuantity] = useState(1);
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const [selectedShopPlanId, setSelectedShopPlanId] = useState<string | undefined>(undefined);

  const handleLogout = () => {
    logout();
    // No need to redirect manually, AuthContext/ProtectedRoute will handle it
  };


  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentScreen(tab as Screen);
    if (tab === 'shop') {
      setSelectedShopPlanId(undefined); // Reset filter when navigating via nav
    }
  };

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const handleProductClick = (product: any) => {
    setSelectedProductId(product.id);
    setCurrentScreen('product-detail');
  };

  const handleProductCheckout = (product: any, quantity: number) => {
    setCheckoutProduct(product);
    setCheckoutQuantity(quantity);
    setCurrentScreen('checkout');
  };

  const handleCheckoutComplete = (orderId: string) => {
    setCurrentScreen('invest');
    setActiveTab('invest');
  };

  const handleInvestmentClick = (investment: any) => {
    setSelectedInvestment(investment);
    setCurrentScreen('investment-detail');
  };

  const handlePlanClick = (planId: string) => {
    setSelectedShopPlanId(planId);
    setCurrentScreen('shop');
    setActiveTab('shop');
  };

  const handleTransactionClick = (transaction: any) => {
    setSelectedTransaction(transaction);
    setCurrentScreen('transaction-detail');
  };

  const showBottomNav = ['home', 'invest', 'shop', 'network', 'wallet'].includes(currentScreen);

  const renderScreen = () => {
    switch (currentScreen) {
      // Login/Register/Splash removed or delegated to ProtectedRoute/AuthContext
      // But keeping home as default entry since AuthContext handles protection

      case 'home':
        return <HomeScreen
          key="home"
          onNavigate={(screen) => navigateTo(screen as Screen)}
          onProductClick={handleProductClick}
        />;

      case 'invest':
        return (
          <InvestScreen
            key="invest"
            onInvestmentClick={handleInvestmentClick}
            onPlanClick={handlePlanClick}
          />
        );

      case 'shop':
        return (
          <ShopScreen
            key="shop"
            onProductClick={handleProductClick}
            initialPlanId={selectedShopPlanId}
          />
        );

      case 'network':
        return <NetworkScreen key="network" />;

      case 'wallet':
        return (
          <WalletScreen
            key="wallet"
            onWithdraw={() => navigateTo('withdraw')}
            onAddFunds={() => navigateTo('addfunds')}
            onTransactionClick={handleTransactionClick}
          />
        );

      case 'investment-detail':
        return (
          <InvestmentDetailScreen
            key="investment-detail"
            investment={selectedInvestment}
            onBack={() => navigateTo('invest')}

          />
        );

      case 'product-detail':
        return (
          <ProductDetailScreen
            key="product-detail"
            productId={selectedProductId || undefined}
            onBack={() => navigateTo('shop')}
            onCheckout={handleProductCheckout}
          />
        );

      case 'checkout':
        return (
          <CheckoutScreen
            key="checkout"
            product={checkoutProduct}
            quantity={checkoutQuantity}
            onBack={() => navigateTo('product-detail')}
            onComplete={handleCheckoutComplete}
          />
        );

      case 'withdraw':
        return (
          <WithdrawScreen
            key="withdraw"
            onBack={() => navigateTo('wallet')}
            onComplete={() => navigateTo('wallet')}
          />
        );

      case 'profile':
        return (
          <ProfileScreen
            key="profile"
            onBack={() => navigateTo('home')}
            onLogout={handleLogout}
          />
        );

      case 'addfunds':
        return (
          <AddFundsScreen
            key="addfunds"
            onBack={() => navigateTo('home')}
            onComplete={() => navigateTo('wallet')}
          />
        );

      case 'orders':
        return (
          <OrdersScreen
            key="orders"
            onBack={() => navigateTo('home')}
            onOrderClick={(orderId) => console.log('Order clicked:', orderId)}
          />
        );

      case 'transaction-detail':
        return (
          <TransactionDetailScreen
            key="transaction-detail"
            transaction={selectedTransaction}
            onBack={() => navigateTo('wallet')}
          />
        );

      default:
        return <HomeScreen key="home" />;
    }
  };

  return (
    <div className="min-h-screen overflow-hidden relative">
      <AnimatedBackground />

      {/* Phone Frame Container */}
      <div className="max-w-[430px] mx-auto min-h-screen relative z-10">
        <AnimatePresence mode="wait">
          {renderScreen()}
        </AnimatePresence>

        {showBottomNav && !!user && (
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        )}
      </div>
    </div>
  );
};

export default Index;