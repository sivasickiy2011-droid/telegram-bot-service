import Icon from '@/components/ui/icon';
import CreateBotDialog from './CreateBotDialog';

interface BotsHeaderProps {
  isAdmin: boolean;
  canCreateBot: boolean;
  restartingEngine: boolean;
  onRestartEngine: () => void;
  newBotName: string;
  newBotToken: string;
  newBotDescription: string;
  newBotLogic: string;
  newBotTemplate: string;
  uniqueNumber: string;
  qrFreeCount: number;
  qrPaidCount: number;
  qrRotationValue: number;
  qrRotationUnit: string;
  paymentEnabled: boolean;
  paymentUrl: string;
  offerImageUrl: string;
  privacyConsentEnabled: boolean;
  privacyConsentText: string;
  secretShopText: string;
  isCreatingBot: boolean;
  setNewBotName: (value: string) => void;
  setNewBotToken: (value: string) => void;
  setNewBotDescription: (value: string) => void;
  setNewBotLogic: (value: string) => void;
  setNewBotTemplate: (value: string) => void;
  setUniqueNumber: (value: string) => void;
  setQrFreeCount: (value: number) => void;
  setQrPaidCount: (value: number) => void;
  setQrRotationValue: (value: number) => void;
  setQrRotationUnit: (value: string) => void;
  setPaymentEnabled: (value: boolean) => void;
  setPaymentUrl: (value: string) => void;
  setOfferImageUrl: (value: string) => void;
  setPrivacyConsentEnabled: (value: boolean) => void;
  setPrivacyConsentText: (value: string) => void;
  setSecretShopText: (value: string) => void;
  handleCreateBot: () => void;
}

const BotsHeader = ({
  isAdmin,
  canCreateBot,
  restartingEngine,
  onRestartEngine,
  newBotName,
  newBotToken,
  newBotDescription,
  newBotLogic,
  newBotTemplate,
  uniqueNumber,
  qrFreeCount,
  qrPaidCount,
  qrRotationValue,
  qrRotationUnit,
  paymentEnabled,
  paymentUrl,
  offerImageUrl,
  privacyConsentEnabled,
  privacyConsentText,
  secretShopText,
  isCreatingBot,
  setNewBotName,
  setNewBotToken,
  setNewBotDescription,
  setNewBotLogic,
  setNewBotTemplate,
  setUniqueNumber,
  setQrFreeCount,
  setQrPaidCount,
  setQrRotationValue,
  setQrRotationUnit,
  setPaymentEnabled,
  setPaymentUrl,
  setOfferImageUrl,
  setPrivacyConsentEnabled,
  setPrivacyConsentText,
  setSecretShopText,
  handleCreateBot,
}: BotsHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold">Мои боты</h2>
        <p className="text-muted-foreground text-sm mt-1">Управляйте вашими Telegram-ботами</p>
      </div>
      <div className="flex gap-2">
        {isAdmin && (
          <button
            onClick={onRestartEngine}
            disabled={restartingEngine}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            title="Перезапустить движок ботов для применения изменений в коде"
          >
            <Icon name={restartingEngine ? "Loader2" : "RefreshCw"} size={16} className={`mr-2 ${restartingEngine ? 'animate-spin' : ''}`} />
            {restartingEngine ? 'Перезапуск...' : 'Перезапустить движок'}
          </button>
        )}
        <CreateBotDialog
          canCreateBot={canCreateBot}
          newBotName={newBotName}
          newBotToken={newBotToken}
          newBotDescription={newBotDescription}
          newBotLogic={newBotLogic}
          newBotTemplate={newBotTemplate}
          uniqueNumber={uniqueNumber}
          qrFreeCount={qrFreeCount}
          qrPaidCount={qrPaidCount}
          qrRotationValue={qrRotationValue}
          qrRotationUnit={qrRotationUnit}
          paymentEnabled={paymentEnabled}
          paymentUrl={paymentUrl}
          offerImageUrl={offerImageUrl}
          privacyConsentEnabled={privacyConsentEnabled}
          privacyConsentText={privacyConsentText}
          secretShopText={secretShopText}
          isCreatingBot={isCreatingBot}
          setNewBotName={setNewBotName}
          setNewBotToken={setNewBotToken}
          setNewBotDescription={setNewBotDescription}
          setNewBotLogic={setNewBotLogic}
          setNewBotTemplate={setNewBotTemplate}
          setUniqueNumber={setUniqueNumber}
          setQrFreeCount={setQrFreeCount}
          setQrPaidCount={setQrPaidCount}
          setQrRotationValue={setQrRotationValue}
          setQrRotationUnit={setQrRotationUnit}
          setPaymentEnabled={setPaymentEnabled}
          setPaymentUrl={setPaymentUrl}
          setOfferImageUrl={setOfferImageUrl}
          setPrivacyConsentEnabled={setPrivacyConsentEnabled}
          setPrivacyConsentText={setPrivacyConsentText}
          setSecretShopText={setSecretShopText}
          handleCreateBot={handleCreateBot}
        />
      </div>
    </div>
  );
};

export default BotsHeader;
