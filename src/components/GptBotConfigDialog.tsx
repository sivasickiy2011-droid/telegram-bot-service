import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';

interface GptBotConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: GptBotConfig) => void;
}

export interface GptBotConfig {
  provider: 'chatgpt' | 'yandexgpt';
  apiKey: string;
  model: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  dailyLimit: number;
  useProxy: boolean;
  proxyUrl: string;
  proxyApiKey: string;
  folderId?: string;
}

const GptBotConfigDialog = ({ open, onOpenChange, onSave }: GptBotConfigDialogProps) => {
  const [provider, setProvider] = useState<'chatgpt' | 'yandexgpt'>('chatgpt');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [systemPrompt, setSystemPrompt] = useState('Ты полезный ассистент. Отвечай на вопросы пользователей максимально полно и понятно.');
  const [maxTokens, setMaxTokens] = useState(1000);
  const [temperature, setTemperature] = useState(0.7);
  const [dailyLimit, setDailyLimit] = useState(100);
  const [useProxy, setUseProxy] = useState(true);
  const [proxyUrl, setProxyUrl] = useState('https://api.pawan.krd/v1');
  const [proxyApiKey, setProxyApiKey] = useState('');
  const [folderId, setFolderId] = useState('');

  const handleSave = () => {
    onSave({
      provider,
      apiKey,
      model,
      systemPrompt,
      maxTokens,
      temperature,
      dailyLimit,
      useProxy,
      proxyUrl,
      proxyApiKey,
      folderId
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Настройка GPT бота</DialogTitle>
          <DialogDescription>
            Настройте AI модель и параметры общения для вашего бота
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="p-4 bg-blue-500/10 border-blue-500/20">
            <div className="flex items-start gap-3">
              <Icon name="Info" size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground">
                <p className="mb-2">
                  <strong className="text-blue-600 dark:text-blue-400">ChatGPT:</strong> Мощная модель от OpenAI. 
                  Требует API ключ (платный). Можно использовать бесплатное прокси.
                </p>
                <p>
                  <strong className="text-blue-600 dark:text-blue-400">YandexGPT:</strong> Российская модель от Яндекса. 
                  Требует API ключ (есть бесплатный тариф).
                </p>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>AI провайдер</Label>
              <Select value={provider} onValueChange={(val) => setProvider(val as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chatgpt">
                    <div className="flex items-center gap-2">
                      <Icon name="Brain" size={16} />
                      ChatGPT (OpenAI)
                    </div>
                  </SelectItem>
                  <SelectItem value="yandexgpt">
                    <div className="flex items-center gap-2">
                      <Icon name="Sparkles" size={16} />
                      YandexGPT (Яндекс)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {provider === 'chatgpt' && (
              <>
                <div className="space-y-2">
                  <Label>Модель ChatGPT</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (быстрая, дешевая)</SelectItem>
                      <SelectItem value="gpt-4">GPT-4 (умная, дорогая)</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo (баланс)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/30">
                  <Checkbox
                    id="use-proxy"
                    checked={useProxy}
                    onCheckedChange={(checked) => setUseProxy(checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="use-proxy" className="cursor-pointer font-medium">
                      Использовать бесплатное прокси
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      🎁 Бесплатный доступ к ChatGPT через прокси-сервис. Не требует API ключа OpenAI.
                    </p>
                  </div>
                </div>

                {useProxy && (
                  <div className="space-y-3 pl-6">
                    <div className="space-y-2">
                      <Label htmlFor="proxy-url">
                        Прокси URL
                      </Label>
                      <Input
                        id="proxy-url"
                        value={proxyUrl}
                        onChange={(e) => setProxyUrl(e.target.value)}
                        placeholder="https://api.pawan.krd/v1"
                      />
                      <p className="text-xs text-muted-foreground">
                        Рекомендуется: https://api.pawan.krd/v1
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="proxy-api-key">
                        Прокси API Key
                        <span className="ml-2 text-xs text-orange-500">Требуется</span>
                      </Label>
                      <Input
                        id="proxy-api-key"
                        type="password"
                        value={proxyApiKey}
                        onChange={(e) => setProxyApiKey(e.target.value)}
                        placeholder="pk-..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Получите бесплатно в Discord: <a href="https://discord.pawan.krd" target="_blank" rel="noopener" className="text-blue-500 underline">discord.pawan.krd</a>
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="proxy-api-key">
                        Прокси API Key
                        <span className="ml-2 text-xs text-orange-500">Требуется</span>
                      </Label>
                      <Input
                        id="proxy-api-key"
                        type="password"
                        value={proxyApiKey}
                        onChange={(e) => setProxyApiKey(e.target.value)}
                        placeholder="pk-..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Получите бесплатно в Discord: <a href="https://discord.pawan.krd" target="_blank" rel="noopener" className="text-blue-500 underline">discord.pawan.krd</a>
                      </p>
                    </div>
                  </div>
                )}

                {!useProxy && (
                  <div className="space-y-2">
                    <Label htmlFor="api-key">
                      OpenAI API Key
                      <span className="ml-2 text-xs text-orange-500">💳 Платно</span>
                    </Label>
                    <Input
                      id="api-key"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Получите на platform.openai.com
                    </p>
                  </div>
                )}
              </>
            )}

            {provider === 'yandexgpt' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="folder-id">
                    Folder ID (из Яндекс.Облако)
                  </Label>
                  <Input
                    id="folder-id"
                    value={folderId}
                    onChange={(e) => setFolderId(e.target.value)}
                    placeholder="b1g..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Найдите в Яндекс.Облако → Обзор → ID каталога
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yandex-api-key">
                    YandexGPT API Key
                  </Label>
                  <Input
                    id="yandex-api-key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AQVN..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Получите в Яндекс.Облако → API ключи. Есть бесплатный тариф (1000 запросов/день)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Модель YandexGPT</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yandexgpt-lite">YandexGPT Lite (быстрая)</SelectItem>
                      <SelectItem value="yandexgpt">YandexGPT (стандартная)</SelectItem>
                      <SelectItem value="yandexgpt-pro">YandexGPT Pro (умная)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="system-prompt">
                Системный промпт (роль бота)
              </Label>
              <Textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={4}
                placeholder="Ты полезный ассистент..."
              />
              <p className="text-xs text-muted-foreground">
                Задайте поведение бота: его роль, стиль общения, правила ответов
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max-tokens">
                  Макс. токенов
                  <span className="ml-2 text-xs text-muted-foreground">(длина ответа)</span>
                </Label>
                <Input
                  id="max-tokens"
                  type="number"
                  min={100}
                  max={4000}
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value) || 1000)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">
                  Temperature
                  <span className="ml-2 text-xs text-muted-foreground">(креативность)</span>
                </Label>
                <Input
                  id="temperature"
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value) || 0.7)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="daily-limit">
                Лимит сообщений в день (на пользователя)
              </Label>
              <Input
                id="daily-limit"
                type="number"
                min={1}
                max={1000}
                value={dailyLimit}
                onChange={(e) => setDailyLimit(parseInt(e.target.value) || 100)}
              />
              <p className="text-xs text-muted-foreground">
                Защита от злоупотреблений и контроль расходов
              </p>
            </div>
          </div>

          <Card className="p-4 bg-green-500/10 border-green-500/20">
            <div className="flex items-start gap-3">
              <Icon name="CheckCircle" size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-medium text-green-600 dark:text-green-400 mb-1">
                  Рекомендуемые настройки для старта:
                </p>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>ChatGPT через бесплатное прокси (без API ключа)</li>
                  <li>Модель: GPT-3.5 Turbo</li>
                  <li>Лимит: 50 сообщений/день</li>
                  <li>Temperature: 0.7</li>
                </ul>
              </div>
            </div>
          </Card>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={
                (provider === 'chatgpt' && useProxy && !proxyApiKey) ||
                (provider === 'chatgpt' && !useProxy && !apiKey) ||
                (provider === 'yandexgpt' && (!apiKey || !folderId))
              }
            >
              <Icon name="Save" size={16} className="mr-2" />
              Сохранить конфигурацию
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GptBotConfigDialog;