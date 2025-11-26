import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import TokenSettingsTab from './settings/TokenSettingsTab';
import PaymentSettingsTab from './settings/PaymentSettingsTab';
import TextsSettingsTab from './settings/TextsSettingsTab';
import AdditionalSettingsTab from './settings/AdditionalSettingsTab';
import InstructionsTab from './settings/InstructionsTab';
import ShopManagementTab from './ShopManagementTab';
import WarehouseManagementTab from './WarehouseManagementTab';

interface Bot {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  users: number;
  messages: number;
  template: string;
  payment_url?: string;
  payment_enabled?: boolean;
  qr_free_count?: number;
  qr_paid_count?: number;
  qr_rotation_value?: number;
  qr_rotation_unit?: string;
}

interface BotSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBot: Bot | null;
  editPaymentUrl: string;
  editPaymentEnabled: boolean;
  savingSettings: boolean;
  setEditPaymentUrl: (value: string) => void;
  setEditPaymentEnabled: (value: boolean) => void;
  editButtonTexts: any;
  setEditButtonTexts: (value: any) => void;
  editMessageTexts: any;
  setEditMessageTexts: (value: any) => void;
  editTbankTerminalKey: string;
  setEditTbankTerminalKey: (value: string) => void;
  editTbankPassword: string;
  setEditTbankPassword: (value: string) => void;
  editVipPrice: number;
  setEditVipPrice: (value: number) => void;
  editOfferImageUrl: string;
  setEditOfferImageUrl: (value: string) => void;
  editPrivacyConsentEnabled: boolean;
  setEditPrivacyConsentEnabled: (value: boolean) => void;
  editPrivacyConsentText: string;
  setEditPrivacyConsentText: (value: string) => void;
  editTelegramToken: string;
  setEditTelegramToken: (value: string) => void;
  editVipPromoEnabled: boolean;
  setEditVipPromoEnabled: (value: boolean) => void;
  editVipPromoStartDate: string;
  setEditVipPromoStartDate: (value: string) => void;
  editVipPromoEndDate: string;
  setEditVipPromoEndDate: (value: string) => void;
  editVipPurchaseMessage: string;
  setEditVipPurchaseMessage: (value: string) => void;
  onSave: () => void;
}

const BotSettingsDialog = ({
  open,
  onOpenChange,
  selectedBot,
  editPaymentUrl,
  editPaymentEnabled,
  savingSettings,
  setEditPaymentUrl,
  setEditPaymentEnabled,
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
  editTelegramToken,
  setEditTelegramToken,
  editVipPromoEnabled,
  setEditVipPromoEnabled,
  editVipPromoStartDate,
  setEditVipPromoStartDate,
  editVipPromoEndDate,
  setEditVipPromoEndDate,
  editVipPurchaseMessage,
  setEditVipPurchaseMessage,
  onSave,
}: BotSettingsDialogProps) => {
  const [activeTab, setActiveTab] = useState('payment');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Настройки бота: {selectedBot?.name}</DialogTitle>
          <DialogDescription>
            Настройте тексты, кнопки и интеграцию с оплатой
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${selectedBot?.template === 'shop' || selectedBot?.template === 'warehouse' ? 'grid-cols-6' : 'grid-cols-5'}`}>
            <TabsTrigger value="token">
              <Icon name="Key" size={14} className="mr-2" />
              Токен
            </TabsTrigger>
            {selectedBot?.template === 'shop' && (
              <TabsTrigger value="shop">
                <Icon name="ShoppingCart" size={14} className="mr-2" />
                Магазин
              </TabsTrigger>
            )}
            {selectedBot?.template === 'warehouse' && (
              <TabsTrigger value="warehouse">
                <Icon name="Warehouse" size={14} className="mr-2" />
                Склад
              </TabsTrigger>
            )}
            <TabsTrigger value="payment">
              <Icon name="CreditCard" size={14} className="mr-2" />
              Оплата
            </TabsTrigger>
            <TabsTrigger value="texts">
              <Icon name="MessageSquare" size={14} className="mr-2" />
              Тексты
            </TabsTrigger>
            <TabsTrigger value="additional">
              <Icon name="Image" size={14} className="mr-2" />
              Доп. настройки
            </TabsTrigger>
            <TabsTrigger value="instructions">
              <Icon name="BookOpen" size={14} className="mr-2" />
              Инструкции
            </TabsTrigger>
          </TabsList>
          
          <TokenSettingsTab
            editTelegramToken={editTelegramToken}
            setEditTelegramToken={setEditTelegramToken}
          />
          
          {selectedBot?.template === 'shop' && <ShopManagementTab botId={selectedBot.id} />}
          
          {selectedBot?.template === 'warehouse' && <WarehouseManagementTab botId={selectedBot.id} />}
          
          <PaymentSettingsTab
            selectedBot={selectedBot}
            editPaymentEnabled={editPaymentEnabled}
            setEditPaymentEnabled={setEditPaymentEnabled}
            editVipPrice={editVipPrice}
            setEditVipPrice={setEditVipPrice}
            editTbankTerminalKey={editTbankTerminalKey}
            setEditTbankTerminalKey={setEditTbankTerminalKey}
            editTbankPassword={editTbankPassword}
            setEditTbankPassword={setEditTbankPassword}
            editVipPromoEnabled={editVipPromoEnabled}
            setEditVipPromoEnabled={setEditVipPromoEnabled}
            editVipPromoStartDate={editVipPromoStartDate}
            setEditVipPromoStartDate={setEditVipPromoStartDate}
            editVipPromoEndDate={editVipPromoEndDate}
            setEditVipPromoEndDate={setEditVipPromoEndDate}
            editVipPurchaseMessage={editVipPurchaseMessage}
            setEditVipPurchaseMessage={setEditVipPurchaseMessage}
          />
          
          <TextsSettingsTab
            editButtonTexts={editButtonTexts}
            setEditButtonTexts={setEditButtonTexts}
            editMessageTexts={editMessageTexts}
            setEditMessageTexts={setEditMessageTexts}
          />
          
          <AdditionalSettingsTab
            editOfferImageUrl={editOfferImageUrl}
            setEditOfferImageUrl={setEditOfferImageUrl}
            editPrivacyConsentEnabled={editPrivacyConsentEnabled}
            setEditPrivacyConsentEnabled={setEditPrivacyConsentEnabled}
            editPrivacyConsentText={editPrivacyConsentText}
            setEditPrivacyConsentText={setEditPrivacyConsentText}
          />
          
          <InstructionsTab />
        </Tabs>
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={onSave} disabled={savingSettings}>
            <Icon name={savingSettings ? "Loader2" : "Save"} size={14} className={`mr-2 ${savingSettings ? 'animate-spin' : ''}`} />
            {savingSettings ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BotSettingsDialog;