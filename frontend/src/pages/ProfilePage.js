import { useAuth } from '@/contexts/AuthContext';
import { TopHeader } from '@/components/layout/TopHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ProviderBadge } from '@/components/shared/ProviderBadge';
import { Copy, Check, User, Mail, Phone, Building2, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';
import { getInitials, formatDateTime } from '@/lib/formatters';

export default function ProfilePage() {
  const { customer, user, isOwner, orgRole, providers } = useAuth();
  const [copiedField, setCopiedField] = useState(null);

  const copy = async (value, label) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(label);
    toast.success('Copied', { description: label });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const displayName = customer?.first_name
    ? `${customer.first_name} ${customer.last_name || ''}`
    : customer?.business_name || 'User';

  const fields = [
    { icon: Mail, label: 'Email', value: user?.email },
    { icon: Phone, label: 'Phone', value: customer?.phone_number },
    { icon: Building2, label: 'Business', value: customer?.business_name, hide: customer?.customer_type === 'INDIVIDUAL' },
    { icon: MapPin, label: 'Country', value: customer?.country },
    { icon: Calendar, label: 'Joined', value: customer?.created_at ? formatDateTime(customer.created_at) : null },
  ].filter(f => f.value && !f.hide);

  return (
    <div data-testid="profile-page">
      <TopHeader title="Profile" showBack />

      <div className="px-4 pt-5 space-y-4">
        {/* Profile Header */}
        <div className="flex flex-col items-center py-4">
          <Avatar className="h-20 w-20 mb-3">
            <AvatarFallback className="bg-[hsl(var(--accent-teal)/0.12)] text-[hsl(var(--accent-teal))] text-xl font-semibold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-lg font-semibold" data-testid="profile-name">{displayName}</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{user?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-[10px] bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]">
              {customer?.customer_type?.replace(/_/g, ' ') || 'Customer'}
            </Badge>
            {isOwner && (
              <Badge variant="outline" className="text-[10px] bg-[hsl(var(--accent-teal)/0.08)] text-[hsl(var(--accent-teal))] border-[hsl(var(--accent-teal)/0.25)]">
                Account Owner
              </Badge>
            )}
            {orgRole && (
              <Badge variant="outline" className="text-[10px] bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]">
                {orgRole.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>
        </div>

        {/* Details Card */}
        <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
          <CardContent className="pt-4 pb-4">
            <h3 className="text-sm font-semibold mb-3">Details</h3>
            <div className="space-y-4">
              {fields.map(field => (
                <div key={field.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <field.icon className="h-4 w-4 text-[hsl(var(--muted-foreground))] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">{field.label}</p>
                      <p className="text-sm truncate">{field.value}</p>
                    </div>
                  </div>
                  {field.label !== 'Joined' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => copy(field.value, field.label)}
                    >
                      {copiedField === field.label
                        ? <Check className="h-3.5 w-3.5 text-[hsl(var(--status-success))]" />
                        : <Copy className="h-3.5 w-3.5" />
                      }
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer ID */}
        {customer?.id && (
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Customer ID</p>
                  <p className="text-xs font-mono tabular-nums break-all mt-0.5">{customer.id}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copy(customer.id, 'Customer ID')}>
                  {copiedField === 'Customer ID'
                    ? <Check className="h-3.5 w-3.5 text-[hsl(var(--status-success))]" />
                    : <Copy className="h-3.5 w-3.5" />
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Provider Connections */}
        {providers.length > 0 && (
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <CardContent className="pt-4 pb-4">
              <h3 className="text-sm font-semibold mb-3">Provider Connections</h3>
              <div className="space-y-3">
                {providers.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[hsl(var(--surface-2))]">
                    <ProviderBadge provider={p.provider} />
                    <Badge
                      variant="outline"
                      className={p.is_enabled
                        ? 'bg-[hsl(var(--status-success)/0.08)] text-[hsl(var(--status-success))] border-[hsl(var(--status-success)/0.25)] text-[10px]'
                        : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] text-[10px]'
                      }
                    >
                      {p.is_enabled ? 'Connected' : 'Disabled'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
