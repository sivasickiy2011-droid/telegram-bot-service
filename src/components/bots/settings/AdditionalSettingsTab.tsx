import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';

interface AdditionalSettingsTabProps {
  editOfferImageUrl: string;
  setEditOfferImageUrl: (value: string) => void;
  editPrivacyConsentEnabled: boolean;
  setEditPrivacyConsentEnabled: (value: boolean) => void;
  editPrivacyConsentText: string;
  setEditPrivacyConsentText: (value: string) => void;
}

const AdditionalSettingsTab = ({
  editOfferImageUrl,
  setEditOfferImageUrl,
  editPrivacyConsentEnabled,
  setEditPrivacyConsentEnabled,
  editPrivacyConsentText,
  setEditPrivacyConsentText,
}: AdditionalSettingsTabProps) => {
  return (
    <TabsContent value="additional" className="space-y-4 mt-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="offer-image">Изображение оффера (URL)</Label>
          <Input
            id="offer-image"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={editOfferImageUrl}
            onChange={(e) => setEditOfferImageUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Изображение, которое пользователь увидит перед оплатой VIP-ключа
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="privacy-consent"
              checked={editPrivacyConsentEnabled}
              onCheckedChange={(checked) => setEditPrivacyConsentEnabled(checked as boolean)}
            />
            <Label htmlFor="privacy-consent" className="cursor-pointer">
              Требовать согласие на обработку персональных данных
            </Label>
          </div>
          
          {editPrivacyConsentEnabled && (
            <div className="pl-6 space-y-2">
              <Label htmlFor="privacy-text">Текст согласия</Label>
              <Textarea
                id="privacy-text"
                value={editPrivacyConsentText}
                onChange={(e) => setEditPrivacyConsentText(e.target.value)}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Пользователь должен будет согласиться перед получением ключа
              </p>
            </div>
          )}
        </div>
        
        <Card className="p-4 bg-blue-500/10 border-blue-500/20">
          <div className="flex items-start gap-3">
            <Icon name="Info" size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="mb-2">
                <strong className="text-blue-600 dark:text-blue-400">Изображение оффера:</strong> Рекомендуется использовать квадратное изображение не менее 512x512 пикселей
              </p>
              <p>
                <strong className="text-blue-600 dark:text-blue-400">Согласие на обработку данных:</strong> Соответствует требованиям 152-ФЗ о персональных данных
              </p>
            </div>
          </div>
        </Card>
      </div>
    </TabsContent>
  );
};

export default AdditionalSettingsTab;
