import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import LoginPage from '@/components/LoginPage';
import RegistrationForm from '@/components/RegistrationForm';
import DashboardTab from '@/components/DashboardTab';
import BotsTab from '@/components/BotsTab';
import AdminTab from '@/components/AdminTab';
import ModerationTab from '@/components/ModerationTab';
import BotActivationTab from '@/components/BotActivationTab';
import QrRotationTab from '@/components/QrRotationTab';
import AppHeader from '@/components/AppHeader';
import { useAuth } from '@/hooks/useAuth';
import { useBotManagement } from '@/hooks/useBotManagement';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const {
    currentUser,
    isAuthenticated,
    authError,
    isTelegramApp,
    needsRegistration,
    tempTelegramUser,
    handleTelegramAuth,
    handleLogout,
    handleRegistrationComplete,
  } = useAuth();

  const botManagement = useBotManagement(currentUser);

  useEffect(() => {
    if (currentUser?.id) {
      botManagement.loadUserBots(currentUser.id);
    }
  }, [currentUser?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (needsRegistration) {
    return (
      <RegistrationForm
        onComplete={(userData) => handleRegistrationComplete(userData, botManagement.loadUserBots)}
        telegramUser={tempTelegramUser}
      />
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onAuth={(tgUser) => handleTelegramAuth(tgUser, botManagement.loadUserBots)} error={authError} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader 
        currentUser={currentUser}
        isTelegramApp={isTelegramApp}
        onLogout={handleLogout}
      />

      <div className="pt-24 pb-12">
        <div className="container mx-auto px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className={`grid w-full max-w-5xl mx-auto h-12 ${currentUser?.role === 'admin' ? 'grid-cols-6' : 'grid-cols-2'}`}>
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Icon name="LayoutDashboard" size={16} />
                Дашборд
              </TabsTrigger>
              <TabsTrigger value="bots" className="flex items-center gap-2">
                <Icon name="Bot" size={16} />
                Мои боты
              </TabsTrigger>
              {currentUser?.role === 'admin' && (
                <>
                  <TabsTrigger value="moderation" className="flex items-center gap-2">
                    <Icon name="AlertCircle" size={16} />
                    Модерация
                  </TabsTrigger>
                  <TabsTrigger value="activation" className="flex items-center gap-2">
                    <Icon name="Play" size={16} />
                    Активация
                  </TabsTrigger>
                  <TabsTrigger value="rotation" className="flex items-center gap-2">
                    <Icon name="RefreshCw" size={16} />
                    Ротация
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="flex items-center gap-2">
                    <Icon name="Shield" size={16} />
                    Пользователи
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="dashboard">
              <DashboardTab 
                bots={botManagement.bots} 
                getStatusColor={getStatusColor} 
              />
            </TabsContent>

            <TabsContent value="bots">
              <BotsTab
                bots={botManagement.bots}
                newBotName={botManagement.newBotName}
                newBotToken={botManagement.newBotToken}
                newBotDescription={botManagement.newBotDescription}
                newBotLogic={botManagement.newBotLogic}
                newBotTemplate={botManagement.newBotTemplate}
                uniqueNumber={botManagement.uniqueNumber}
                qrFreeCount={botManagement.qrFreeCount}
                qrPaidCount={botManagement.qrPaidCount}
                qrRotationValue={botManagement.qrRotationValue}
                qrRotationUnit={botManagement.qrRotationUnit}
                paymentEnabled={botManagement.paymentEnabled}
                paymentUrl={botManagement.paymentUrl}
                offerImageUrl={botManagement.offerImageUrl}
                privacyConsentEnabled={botManagement.privacyConsentEnabled}
                privacyConsentText={botManagement.privacyConsentText}
                isCreatingBot={botManagement.isCreatingBot}
                setNewBotName={botManagement.setNewBotName}
                setNewBotToken={botManagement.setNewBotToken}
                setNewBotDescription={botManagement.setNewBotDescription}
                setNewBotLogic={botManagement.setNewBotLogic}
                setNewBotTemplate={botManagement.setNewBotTemplate}
                setUniqueNumber={botManagement.setUniqueNumber}
                setQrFreeCount={botManagement.setQrFreeCount}
                setQrPaidCount={botManagement.setQrPaidCount}
                setQrRotationValue={botManagement.setQrRotationValue}
                setQrRotationUnit={botManagement.setQrRotationUnit}
                setPaymentEnabled={botManagement.setPaymentEnabled}
                setPaymentUrl={botManagement.setPaymentUrl}
                setOfferImageUrl={botManagement.setOfferImageUrl}
                setPrivacyConsentEnabled={botManagement.setPrivacyConsentEnabled}
                setPrivacyConsentText={botManagement.setPrivacyConsentText}
                handleCreateBot={botManagement.handleCreateBot}
                handleDeleteBot={botManagement.handleDeleteBot}
                getStatusColor={getStatusColor}
                currentUser={currentUser}
                onBotsUpdated={() => botManagement.loadUserBots(currentUser?.id)}
              />
            </TabsContent>

            {currentUser?.role === 'admin' && (
              <>
                <TabsContent value="moderation">
                  <ModerationTab 
                    currentUser={currentUser}
                    onModerate={() => botManagement.loadUserBots(currentUser.id)}
                  />
                </TabsContent>
                <TabsContent value="activation">
                  <BotActivationTab 
                    currentUser={currentUser}
                  />
                </TabsContent>
                <TabsContent value="rotation">
                  <QrRotationTab 
                    currentUser={currentUser}
                  />
                </TabsContent>
                <TabsContent value="admin">
                  <AdminTab 
                    getStatusColor={getStatusColor} 
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
