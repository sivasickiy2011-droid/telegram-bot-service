import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import BotCard from './bots/BotCard';
import BotSettingsDialog from './bots/BotSettingsDialog';
import BotStatsDialog from './bots/BotStatsDialog';
import BotsHeader from './bots/BotsHeader';
import { BotsTabProps } from './bots/types';
import { useBotsManagement } from './bots/useBotsManagement';

const BotsTab = ({
  bots,
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
  handleDeleteBot,
  getStatusColor,
  currentUser,
  onBotsUpdated,
}: BotsTabProps) => {
  const isAdmin = currentUser?.role === 'admin';
  const canCreateBot = isAdmin || bots.length < 1;
  
  const {
    selectedBot,
    settingsOpen,
    setSettingsOpen,
    statsOpen,
    setStatsOpen,
    botStats,
    loadingStats,
    editPaymentUrl,
    setEditPaymentUrl,
    editPaymentEnabled,
    setEditPaymentEnabled,
    savingSettings,
    editButtonTexts,
    setEditButtonTexts,
    editMessageTexts,
    setEditMessageTexts,
    editTbankTerminalKey,
    setEditTbankTerminalKey,
    editTbankPassword,
    setEditTbankPassword,
    editVipPrice,
    setEditVipPrice,
    editOfferImageUrl,
    setEditOfferImageUrl,
    editPrivacyConsentEnabled,
    setEditPrivacyConsentEnabled,
    editPrivacyConsentText,
    setEditPrivacyConsentText,
    editVipPromoEnabled,
    setEditVipPromoEnabled,
    editVipPromoStartDate,
    setEditVipPromoStartDate,
    editVipPromoEndDate,
    setEditVipPromoEndDate,
    editVipPurchaseMessage,
    setEditVipPurchaseMessage,
    editTelegramToken,
    setEditTelegramToken,
    restartingEngine,
    openSettings,
    openStats,
    saveSettings,
    handleToggleStatus,
    getBotTypeLabel,
    handleRestartBotEngine,
    handleSetupWebhook,
  } = useBotsManagement(currentUser, onBotsUpdated);

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-20 md:pb-0">
      {!isAdmin && bots.length >= 1 && (
        <Card className="p-3 md:p-4 bg-muted/30 border-orange-500/50">
          <div className="flex items-start gap-2 md:gap-3">
            <Icon name="Info" size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs md:text-sm">
              <p className="font-medium mb-1">Базовый тариф</p>
              <p className="text-muted-foreground">
                Вы можете создать только одного бота с шаблоном POLYTOPE. Для расширенных возможностей обратитесь к администратору.
              </p>
            </div>
          </div>
        </Card>
      )}
      
      <BotsHeader
        isAdmin={isAdmin}
        canCreateBot={canCreateBot}
        restartingEngine={restartingEngine}
        onRestartEngine={handleRestartBotEngine}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bots.map((bot, index) => (
          <BotCard
            key={bot.id}
            bot={bot}
            index={index}
            getStatusColor={getStatusColor}
            getBotTypeLabel={getBotTypeLabel}
            onSettings={openSettings}
            onStats={openStats}
            onDelete={handleDeleteBot}
            onToggleStatus={handleToggleStatus}
            onSetupWebhook={isAdmin ? handleSetupWebhook : undefined}
          />
        ))}
      </div>
      
      <BotSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        selectedBot={selectedBot}
        editPaymentUrl={editPaymentUrl}
        editPaymentEnabled={editPaymentEnabled}
        savingSettings={savingSettings}
        setEditPaymentUrl={setEditPaymentUrl}
        setEditPaymentEnabled={setEditPaymentEnabled}
        editButtonTexts={editButtonTexts}
        setEditButtonTexts={setEditButtonTexts}
        editMessageTexts={editMessageTexts}
        setEditMessageTexts={setEditMessageTexts}
        editTbankTerminalKey={editTbankTerminalKey}
        setEditTbankTerminalKey={setEditTbankTerminalKey}
        editTbankPassword={editTbankPassword}
        setEditTbankPassword={setEditTbankPassword}
        editVipPrice={editVipPrice}
        setEditVipPrice={setEditVipPrice}
        editOfferImageUrl={editOfferImageUrl}
        setEditOfferImageUrl={setEditOfferImageUrl}
        editPrivacyConsentEnabled={editPrivacyConsentEnabled}
        setEditPrivacyConsentEnabled={setEditPrivacyConsentEnabled}
        editPrivacyConsentText={editPrivacyConsentText}
        setEditPrivacyConsentText={setEditPrivacyConsentText}
        editTelegramToken={editTelegramToken}
        setEditTelegramToken={setEditTelegramToken}
        editVipPromoEnabled={editVipPromoEnabled}
        setEditVipPromoEnabled={setEditVipPromoEnabled}
        editVipPromoStartDate={editVipPromoStartDate}
        setEditVipPromoStartDate={setEditVipPromoStartDate}
        editVipPromoEndDate={editVipPromoEndDate}
        setEditVipPromoEndDate={setEditVipPromoEndDate}
        editVipPurchaseMessage={editVipPurchaseMessage}
        setEditVipPurchaseMessage={setEditVipPurchaseMessage}
        onSave={saveSettings}
      />
      
      <BotStatsDialog
        open={statsOpen}
        onOpenChange={setStatsOpen}
        selectedBot={selectedBot}
        botStats={botStats}
        loadingStats={loadingStats}
      />
    </div>
  );
};

export default BotsTab;