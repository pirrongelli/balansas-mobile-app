import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

const STEPS = ['Account', 'Profile', 'Address', 'Bank Details', 'Institution'];

const PAYMENT_RAILS = {
  USD: [
    { value: 'ACH', label: 'ACH (Standard)' },
    { value: 'FEDWIRE', label: 'Fedwire (Same-day)' },
    { value: 'SWIFT', label: 'SWIFT (International)' },
  ],
  EUR: [
    { value: 'SEPA_CT', label: 'SEPA Credit Transfer' },
    { value: 'SWIFT', label: 'SWIFT (International)' },
  ],
  GBP: [
    { value: 'FPS', label: 'Faster Payments' },
    { value: 'CHAPS', label: 'CHAPS' },
    { value: 'SWIFT', label: 'SWIFT (International)' },
  ],
};

const RELATIONSHIPS = ['EMPLOYEE', 'CUSTOMER', 'SUPPLIER', 'CONTRACTOR', 'PARTNER', 'OTHER'];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC'
];

const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan' }, { code: 'AL', name: 'Albania' }, { code: 'DZ', name: 'Algeria' },
  { code: 'AD', name: 'Andorra' }, { code: 'AR', name: 'Argentina' }, { code: 'AM', name: 'Armenia' },
  { code: 'AU', name: 'Australia' }, { code: 'AT', name: 'Austria' }, { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BH', name: 'Bahrain' }, { code: 'BD', name: 'Bangladesh' }, { code: 'BY', name: 'Belarus' },
  { code: 'BE', name: 'Belgium' }, { code: 'BR', name: 'Brazil' }, { code: 'BG', name: 'Bulgaria' },
  { code: 'CA', name: 'Canada' }, { code: 'CL', name: 'Chile' }, { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' }, { code: 'CR', name: 'Costa Rica' }, { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' }, { code: 'CZ', name: 'Czech Republic' }, { code: 'DK', name: 'Denmark' },
  { code: 'DO', name: 'Dominican Republic' }, { code: 'EC', name: 'Ecuador' }, { code: 'EG', name: 'Egypt' },
  { code: 'EE', name: 'Estonia' }, { code: 'FI', name: 'Finland' }, { code: 'FR', name: 'France' },
  { code: 'GE', name: 'Georgia' }, { code: 'DE', name: 'Germany' }, { code: 'GH', name: 'Ghana' },
  { code: 'GR', name: 'Greece' }, { code: 'GT', name: 'Guatemala' }, { code: 'HK', name: 'Hong Kong' },
  { code: 'HU', name: 'Hungary' }, { code: 'IS', name: 'Iceland' }, { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' }, { code: 'IE', name: 'Ireland' }, { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' }, { code: 'JM', name: 'Jamaica' }, { code: 'JP', name: 'Japan' },
  { code: 'JO', name: 'Jordan' }, { code: 'KZ', name: 'Kazakhstan' }, { code: 'KE', name: 'Kenya' },
  { code: 'KR', name: 'South Korea' }, { code: 'KW', name: 'Kuwait' }, { code: 'LV', name: 'Latvia' },
  { code: 'LB', name: 'Lebanon' }, { code: 'LI', name: 'Liechtenstein' }, { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' }, { code: 'MY', name: 'Malaysia' }, { code: 'MT', name: 'Malta' },
  { code: 'MX', name: 'Mexico' }, { code: 'MD', name: 'Moldova' }, { code: 'MC', name: 'Monaco' },
  { code: 'ME', name: 'Montenegro' }, { code: 'MA', name: 'Morocco' }, { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' }, { code: 'NG', name: 'Nigeria' }, { code: 'MK', name: 'North Macedonia' },
  { code: 'NO', name: 'Norway' }, { code: 'OM', name: 'Oman' }, { code: 'PK', name: 'Pakistan' },
  { code: 'PA', name: 'Panama' }, { code: 'PE', name: 'Peru' }, { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' }, { code: 'QA', name: 'Qatar' },
  { code: 'RO', name: 'Romania' }, { code: 'SA', name: 'Saudi Arabia' }, { code: 'RS', name: 'Serbia' },
  { code: 'SG', name: 'Singapore' }, { code: 'SK', name: 'Slovakia' }, { code: 'SI', name: 'Slovenia' },
  { code: 'ZA', name: 'South Africa' }, { code: 'ES', name: 'Spain' }, { code: 'LK', name: 'Sri Lanka' },
  { code: 'SE', name: 'Sweden' }, { code: 'CH', name: 'Switzerland' }, { code: 'TW', name: 'Taiwan' },
  { code: 'TH', name: 'Thailand' }, { code: 'TN', name: 'Tunisia' }, { code: 'TR', name: 'Turkey' },
  { code: 'UA', name: 'Ukraine' }, { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'US', name: 'United States' },
  { code: 'UY', name: 'Uruguay' }, { code: 'VE', name: 'Venezuela' }, { code: 'VN', name: 'Vietnam' },
];

const initialForm = {
  // Account
  currency: 'USD',
  paymentRail: 'ACH',
  description: '',
  // Profile
  name: '',
  profileType: 'INDIVIDUAL',
  email: '',
  phone: '',
  dob: '',
  relationship: 'CUSTOMER',
  // Address
  addrCountry: 'US',
  addrLine1: '',
  addrLine2: '',
  addrCity: '',
  addrState: '',
  addrPostal: '',
  // Bank
  accountNumber: '',
  routingNumber: '',
  accountType: 'CHECKING',
  iban: '',
  bic: '',
  sortCode: '',
  // Institution
  instName: '',
  instCountry: 'US',
  instLine1: '',
  instCity: '',
  instState: '',
  instPostal: '',
};

export const RailCounterpartyWizard = ({ customerId, onSuccess, onCancel }) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const availableRails = PAYMENT_RAILS[form.currency] || PAYMENT_RAILS.USD;
  const needsSwift = form.paymentRail === 'SWIFT';
  const isUSD = form.currency === 'USD';
  const isGBP = form.currency === 'GBP';
  const isEUR = form.currency === 'EUR';

  const validateStep = () => {
    switch (step) {
      case 0: return !!form.currency && !!form.paymentRail;
      case 1: return !!form.name && !!form.email && !!form.phone && !!form.relationship;
      case 2: return !!form.addrCountry && !!form.addrLine1 && !!form.addrCity && !!form.addrPostal;
      case 3: {
        if (isEUR) return !!form.iban;
        if (isGBP && !needsSwift) return !!form.sortCode && !!form.accountNumber;
        if (isUSD && !needsSwift) return !!form.accountNumber && !!form.routingNumber;
        if (needsSwift) return !!form.accountNumber && !!form.bic;
        return !!form.accountNumber;
      }
      case 4: return !!form.instName && !!form.instCountry && !!form.instLine1 && !!form.instCity;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const accountInfo = {};
      if (isEUR) {
        accountInfo.iban = form.iban;
        if (form.bic) accountInfo.swift_bic = form.bic;
      } else if (isGBP && !needsSwift) {
        accountInfo.sort_code = form.sortCode;
        accountInfo.account_number = form.accountNumber;
      } else if (isUSD && !needsSwift) {
        accountInfo.account_number = form.accountNumber;
        accountInfo.routing_number = form.routingNumber;
        accountInfo.account_type = form.accountType;
      }
      if (needsSwift) {
        accountInfo.account_number = form.accountNumber;
        accountInfo.swift_bic = form.bic;
        if (form.routingNumber) accountInfo.routing_number = form.routingNumber;
      }

      const body = {
        profile: {
          name: form.name,
          profile_type: form.profileType,
          email: form.email,
          phone: form.phone,
          relationship: form.relationship,
          ...(form.dob ? { date_of_birth: form.dob } : {}),
        },
        account_information: accountInfo,
        address: {
          country: form.addrCountry,
          line1: form.addrLine1.slice(0, 35),
          line2: form.addrLine2 || undefined,
          city: form.addrCity,
          state: form.addrState || undefined,
          postal_code: form.addrPostal,
        },
        supported_rails: [form.paymentRail],
        currency: form.currency,
        description: form.description || undefined,
        institution: {
          name: form.instName,
          country: form.instCountry,
          address: {
            line1: form.instLine1,
            city: form.instCity,
            state: form.instState || undefined,
            postal_code: form.instPostal || undefined,
          },
        },
      };

      console.log('[Counterparty] Payload:', JSON.stringify(body, null, 2));

      const response = await supabase.functions.invoke('rail-proxy', {
        body: { customerId, endpoint: '/counterparties', method: 'POST', body },
      });

      if (response.error) {
        let detail = response.error.message;
        if (response.error.context) {
          try {
            const errBody = await response.error.context.json();
            console.log('[Counterparty] Error:', errBody);
            detail = errBody?.message || errBody?.error || JSON.stringify(errBody);
          } catch { /* ignore */ }
        }
        throw new Error(detail);
      }
      if (response.data?.error || response.data?.errorCode) {
        throw new Error(response.data.message || response.data.error);
      }

      toast.success('Counterparty created');
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Failed to create counterparty');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step === 4) { handleSubmit(); return; }
    setStep(s => s + 1);
  };

  const inputCls = "h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]";

  return (
    <div className="space-y-4" data-testid="rail-counterparty-wizard">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] text-[hsl(var(--muted-foreground))]">
          <span>Step {step + 1} of {STEPS.length}</span>
          <span className="font-medium text-[hsl(var(--foreground))]">{STEPS[step]}</span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-1" />
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-[hsl(var(--status-danger))] bg-[hsl(var(--status-danger)/0.08)] rounded-lg px-3 py-2.5">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span className="break-words">{error}</span>
        </div>
      )}

      {/* Step 0: Account */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Currency <span className="text-[hsl(var(--status-danger))]">*</span></Label>
            <Select value={form.currency} onValueChange={(v) => { set('currency', v); set('paymentRail', (PAYMENT_RAILS[v] || PAYMENT_RAILS.USD)[0].value); }}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Payment Rail <span className="text-[hsl(var(--status-danger))]">*</span></Label>
            <Select value={form.paymentRail} onValueChange={(v) => set('paymentRail', v)}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableRails.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Description</Label>
            <Input placeholder="Optional label" value={form.description} onChange={(e) => set('description', e.target.value)} className={inputCls} />
          </div>
        </div>
      )}

      {/* Step 1: Profile */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Full Name <span className="text-[hsl(var(--status-danger))]">*</span></Label>
            <Input placeholder="John Smith" value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">Type</Label>
              <Select value={form.profileType} onValueChange={(v) => set('profileType', v)}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                  <SelectItem value="BUSINESS">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Relationship <span className="text-[hsl(var(--status-danger))]">*</span></Label>
              <Select value={form.relationship} onValueChange={(v) => set('relationship', v)}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map(r => <SelectItem key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Email <span className="text-[hsl(var(--status-danger))]">*</span></Label>
            <Input type="email" placeholder="john@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Phone (E.164) <span className="text-[hsl(var(--status-danger))]">*</span></Label>
            <Input placeholder="+14155551234" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} />
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Must start with + followed by country code</p>
          </div>
          {form.profileType === 'INDIVIDUAL' && (
            <div className="space-y-2">
              <Label className="text-sm">Date of Birth</Label>
              <Input type="date" value={form.dob} onChange={(e) => set('dob', e.target.value)} className={inputCls} />
            </div>
          )}
        </div>
      )}

      {/* Step 2: Address */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Country <span className="text-[hsl(var(--status-danger))]">*</span></Label>
            <Select value={form.addrCountry} onValueChange={(v) => set('addrCountry', v)}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Address Line 1 <span className="text-[hsl(var(--status-danger))]">*</span> <span className="text-[10px] text-[hsl(var(--muted-foreground))]">(max 35 chars)</span></Label>
            <Input placeholder="123 Main St" value={form.addrLine1} onChange={(e) => set('addrLine1', e.target.value.slice(0, 35))} className={inputCls} maxLength={35} />
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{form.addrLine1.length}/35</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Address Line 2</Label>
            <Input placeholder="Apt 4B" value={form.addrLine2} onChange={(e) => set('addrLine2', e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">City <span className="text-[hsl(var(--status-danger))]">*</span></Label>
              <Input placeholder="New York" value={form.addrCity} onChange={(e) => set('addrCity', e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">State</Label>
              {form.addrCountry === 'US' ? (
                <Select value={form.addrState} onValueChange={(v) => set('addrState', v)}>
                  <SelectTrigger className={inputCls}><SelectValue placeholder="State" /></SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input placeholder="Region" value={form.addrState} onChange={(e) => set('addrState', e.target.value)} className={inputCls} />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Postal Code <span className="text-[hsl(var(--status-danger))]">*</span></Label>
            <Input placeholder="10001" value={form.addrPostal} onChange={(e) => set('addrPostal', e.target.value)} className={inputCls} />
          </div>
        </div>
      )}

      {/* Step 3: Bank Details */}
      {step === 3 && (
        <div className="space-y-4">
          {isEUR && (
            <>
              <div className="space-y-2">
                <Label className="text-sm">IBAN <span className="text-[hsl(var(--status-danger))]">*</span></Label>
                <Input placeholder="DE89370400440532013000" value={form.iban} onChange={(e) => set('iban', e.target.value.toUpperCase().replace(/\s/g, ''))} className={inputCls} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">BIC / SWIFT {needsSwift && <span className="text-[hsl(var(--status-danger))]">*</span>}</Label>
                <Input placeholder="COBADEFFXXX" value={form.bic} onChange={(e) => set('bic', e.target.value.toUpperCase())} className={inputCls} maxLength={11} />
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">8 or 11 characters (e.g., COBADEFFXXX)</p>
              </div>
            </>
          )}
          {isGBP && !needsSwift && (
            <>
              <div className="space-y-2">
                <Label className="text-sm">Sort Code <span className="text-[hsl(var(--status-danger))]">*</span></Label>
                <Input placeholder="040004" value={form.sortCode} onChange={(e) => set('sortCode', e.target.value.replace(/\D/g, '').slice(0, 6))} className={inputCls} maxLength={6} />
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">6 digits</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Account Number <span className="text-[hsl(var(--status-danger))]">*</span></Label>
                <Input placeholder="12345678" value={form.accountNumber} onChange={(e) => set('accountNumber', e.target.value.replace(/\D/g, '').slice(0, 8))} className={inputCls} maxLength={8} />
              </div>
            </>
          )}
          {isUSD && !needsSwift && (
            <>
              <div className="space-y-2">
                <Label className="text-sm">Account Number <span className="text-[hsl(var(--status-danger))]">*</span></Label>
                <Input placeholder="123456789" value={form.accountNumber} onChange={(e) => set('accountNumber', e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Routing Number <span className="text-[hsl(var(--status-danger))]">*</span></Label>
                <Input placeholder="021000021" value={form.routingNumber} onChange={(e) => set('routingNumber', e.target.value.replace(/\D/g, '').slice(0, 9))} className={inputCls} maxLength={9} />
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">9 digits</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Account Type</Label>
                <Select value={form.accountType} onValueChange={(v) => set('accountType', v)}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHECKING">Checking</SelectItem>
                    <SelectItem value="SAVINGS">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          {needsSwift && !isEUR && (
            <>
              <div className="space-y-2">
                <Label className="text-sm">Account Number <span className="text-[hsl(var(--status-danger))]">*</span></Label>
                <Input placeholder="123456789" value={form.accountNumber} onChange={(e) => set('accountNumber', e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">BIC / SWIFT <span className="text-[hsl(var(--status-danger))]">*</span></Label>
                <Input placeholder="CHASUS33XXX" value={form.bic} onChange={(e) => set('bic', e.target.value.toUpperCase())} className={inputCls} maxLength={11} />
              </div>
              {isUSD && (
                <div className="space-y-2">
                  <Label className="text-sm">Routing Number</Label>
                  <Input placeholder="021000021" value={form.routingNumber} onChange={(e) => set('routingNumber', e.target.value.replace(/\D/g, '').slice(0, 9))} className={inputCls} maxLength={9} />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Step 4: Institution */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Bank / Institution Name <span className="text-[hsl(var(--status-danger))]">*</span></Label>
            <Input placeholder="JPMorgan Chase" value={form.instName} onChange={(e) => set('instName', e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Country <span className="text-[hsl(var(--status-danger))]">*</span></Label>
            <Select value={form.instCountry} onValueChange={(v) => set('instCountry', v)}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Address <span className="text-[hsl(var(--status-danger))]">*</span></Label>
            <Input placeholder="383 Madison Ave" value={form.instLine1} onChange={(e) => set('instLine1', e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">City <span className="text-[hsl(var(--status-danger))]">*</span></Label>
              <Input placeholder="New York" value={form.instCity} onChange={(e) => set('instCity', e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">State</Label>
              <Input placeholder="NY" value={form.instState} onChange={(e) => set('instState', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Postal Code</Label>
            <Input placeholder="10179" value={form.instPostal} onChange={(e) => set('instPostal', e.target.value)} className={inputCls} />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-2 pt-2">
        {step > 0 ? (
          <Button variant="secondary" onClick={() => { setStep(s => s - 1); setError(''); }} className="flex-shrink-0">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        ) : (
          <Button variant="secondary" onClick={onCancel} className="flex-shrink-0">
            Cancel
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={!validateStep() || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Creating...
            </span>
          ) : step === 4 ? 'Create Counterparty' : (
            <span className="flex items-center gap-1">Continue <ChevronRight className="h-4 w-4" /></span>
          )}
        </Button>
      </div>
    </div>
  );
};
