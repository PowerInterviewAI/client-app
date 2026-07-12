/**
 * Payment Page
 * Unified page for payment management with tabs for plans, history, and status
 */

import { ArrowLeft, CreditCard, History, Receipt } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import BuyCreditsTab from '@/components/custom/payment/buy-credits-tab';
import PaymentHistoryTab from '@/components/custom/payment/payment-history-tab';
import PaymentStatusTab from '@/components/custom/payment/payment-status-tab';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppState } from '@/hooks/use-app-state';
import { usePayment } from '@/hooks/use-payment';

type PaymentTab = 'buy' | 'history' | 'status';

export default function PaymentPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<PaymentTab>('buy');
  const [statusPaymentId, setStatusPaymentId] = useState('');
  const { appState } = useAppState();
  const { getCurrencies } = usePayment();

  useEffect(() => {
    getCurrencies();
  }, [getCurrencies]);

  const handlePaymentCreated = (paymentId: string) => {
    setStatusPaymentId(paymentId);
    setActiveTab('status');
  };

  const handleViewPayment = (paymentId: string) => {
    setStatusPaymentId(paymentId);
    setActiveTab('status');
  };

  const handleSwitchToBuy = () => {
    setActiveTab('buy');
  };

  const remainingCredits = appState?.credits ?? 0;

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as PaymentTab)}
      className="w-full flex flex-col bg-background"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background px-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate(-1)}
            className="flex items-center shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-sm font-semibold shrink-0">Buy Credits</h1>
          <TabsList className="ml-auto">
            <TabsTrigger value="buy" className="flex items-center gap-1.5">
              <CreditCard className="h-4 w-4" />
              <span>Buy Credits</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1.5">
              <History className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-1.5">
              <Receipt className="h-4 w-4" />
              <span>Status</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden px-4 py-3 w-full max-w-3xl mx-auto">
        <TabsContent value="buy" className="flex-1 mt-0">
          <BuyCreditsTab credits={remainingCredits} onPaymentCreated={handlePaymentCreated} />
        </TabsContent>

        <TabsContent value="history" className="flex-1 mt-0">
          <PaymentHistoryTab
            isActive={activeTab === 'history'}
            onViewPayment={handleViewPayment}
            onSwitchToBuy={handleSwitchToBuy}
          />
        </TabsContent>

        <TabsContent value="status" className="flex-1 mt-0">
          <PaymentStatusTab key={statusPaymentId} initialPaymentId={statusPaymentId} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
