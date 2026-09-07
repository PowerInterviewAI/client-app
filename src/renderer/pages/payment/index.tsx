/**
 * Payment Page
 * Unified page for payment management with tabs for plans, history, and status
 */

import { CreditCard, History, Receipt } from 'lucide-react';
import { useEffect, useState } from 'react';

import PageHeader from '@/components/custom/page-header';
import BuyCreditsTab from '@/components/custom/payment/buy-credits-tab';
import PaymentHistoryTab from '@/components/custom/payment/payment-history-tab';
import PaymentStatusTab from '@/components/custom/payment/payment-status-tab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppState } from '@/hooks/use-app-state';
import { usePayment } from '@/hooks/use-payment';

type PaymentTab = 'buy' | 'history' | 'status';

export default function PaymentPage() {
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
      {/* Header. Falls back to `/main` rather than home: this page is most often opened from the
          interview screen, on a credits warning the user wants to get back from. */}
      <PageHeader title="Buy Credits" fallback="/main">
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
      </PageHeader>

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
