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

export default function PaymentPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('buy');
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
    <div className="w-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Buy Credits</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Buy credits, view payment history, and check payment status
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden px-6 py-6 w-full max-w-4xl mx-auto">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'buy' | 'history' | 'status')}
          className="h-full flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="buy" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span>Buy Credits</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              <span>Status</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="flex-1 mt-6">
            <BuyCreditsTab credits={remainingCredits} onPaymentCreated={handlePaymentCreated} />
          </TabsContent>

          <TabsContent value="history" className="flex-1 mt-6">
            <PaymentHistoryTab
              isActive={activeTab === 'history'}
              onViewPayment={handleViewPayment}
              onSwitchToBuy={handleSwitchToBuy}
            />
          </TabsContent>

          <TabsContent value="status" className="flex-1 mt-6">
            <PaymentStatusTab key={statusPaymentId} initialPaymentId={statusPaymentId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
