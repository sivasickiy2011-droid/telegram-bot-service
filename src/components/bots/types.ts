export interface Bot {
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
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  moderationReason?: string;
}

export interface BotsTabProps {
  bots: Bot[];
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
  handleDeleteBot: (botId: string) => void;
  getStatusColor: (status: string) => string;
  currentUser?: any;
  onBotsUpdated?: () => void;
}
