import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface RegistrationFormProps {
  onComplete: (userData: any) => void;
  telegramUser: any;
}

const RegistrationForm = ({ onComplete, telegramUser }: RegistrationFormProps) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [entityType, setEntityType] = useState<'individual' | 'legal'>('individual');
  const [legalDetails, setLegalDetails] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToCookies, setAgreedToCookies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'ФИО обязательно для заполнения';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Номер телефона обязателен';
    } else if (!/^\+?[0-9]{10,15}$/.test(phone.replace(/[\s-]/g, ''))) {
      newErrors.phone = 'Введите корректный номер телефона';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Введите корректный email';
    }

    if (entityType === 'legal' && !legalDetails.trim()) {
      newErrors.legalDetails = 'Реквизиты юридического лица обязательны';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'Необходимо согласие с правилами платформы';
    }

    if (!agreedToCookies) {
      newErrors.cookies = 'Необходимо согласие с использованием cookies';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('https://functions.poehali.dev/f9ce7f74-6b2b-44d4-9505-72fb689a4374', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          telegram_id: telegramUser.id,
          full_name: fullName,
          phone: phone,
          email: email || null,
          entity_type: entityType,
          legal_details: entityType === 'legal' ? legalDetails : null,
          agreed_to_terms: agreedToTerms,
          agreed_to_cookies: agreedToCookies,
          registration_completed: true
        })
      });

      const data = await response.json();

      if (response.ok) {
        onComplete(data.user);
      } else {
        setErrors({ submit: data.error || 'Ошибка регистрации' });
      }
    } catch (error) {
      setErrors({ submit: 'Ошибка сети. Попробуйте позже.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 glass-card">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-purple flex items-center justify-center">
            <Icon name="UserPlus" size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Регистрация на платформе</h1>
          <p className="text-muted-foreground">
            Заполните данные для завершения регистрации
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">
              ФИО <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Иванов Иван Иванович"
              className={errors.fullName ? 'border-red-500' : ''}
            />
            {errors.fullName && (
              <p className="text-xs text-red-500">{errors.fullName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Номер телефона <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 900 123 45 67"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (необязательно)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Тип лица</Label>
            <RadioGroup
              value={entityType}
              onValueChange={(value) => setEntityType(value as 'individual' | 'legal')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual" className="cursor-pointer font-normal">
                  Физическое лицо
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="legal" id="legal" />
                <Label htmlFor="legal" className="cursor-pointer font-normal">
                  Юридическое лицо
                </Label>
              </div>
            </RadioGroup>
          </div>

          {entityType === 'legal' && (
            <div className="space-y-2">
              <Label htmlFor="legalDetails">
                Реквизиты юридического лица <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="legalDetails"
                value={legalDetails}
                onChange={(e) => setLegalDetails(e.target.value)}
                placeholder="ИНН, ОГРН, юридический адрес, название организации"
                rows={4}
                className={errors.legalDetails ? 'border-red-500' : ''}
              />
              {errors.legalDetails && (
                <p className="text-xs text-red-500">{errors.legalDetails}</p>
              )}
            </div>
          )}

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                className={errors.terms ? 'border-red-500' : ''}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="terms"
                  className="text-sm font-normal cursor-pointer"
                >
                  Я согласен с{' '}
                  <a
                    href="/terms"
                    target="_blank"
                    className="text-primary underline hover:no-underline"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open('/terms', '_blank');
                    }}
                  >
                    правилами использования платформы
                  </a>
                  <span className="text-red-500"> *</span>
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="cookies"
                checked={agreedToCookies}
                onCheckedChange={(checked) => setAgreedToCookies(checked as boolean)}
                className={errors.cookies ? 'border-red-500' : ''}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="cookies"
                  className="text-sm font-normal cursor-pointer"
                >
                  Я согласен с{' '}
                  <a
                    href="/cookie-policy"
                    target="_blank"
                    className="text-primary underline hover:no-underline"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open('/cookie-policy', '_blank');
                    }}
                  >
                    политикой использования cookies
                  </a>
                  <span className="text-red-500"> *</span>
                </Label>
              </div>
            </div>

            {(errors.terms || errors.cookies) && (
              <p className="text-xs text-red-500">
                Необходимо согласие со всеми условиями
              </p>
            )}
          </div>

          {errors.submit && (
            <Card className="p-3 bg-red-500/10 border-red-500/20">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
            </Card>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Регистрация...
              </>
            ) : (
              <>
                <Icon name="CheckCircle" size={16} className="mr-2" />
                Завершить регистрацию
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default RegistrationForm;
