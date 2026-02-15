import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TopHeader } from '@/components/layout/TopHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Users, Shield, User, LogOut, ChevronRight, Settings,
  Bell, HelpCircle, FileText, CreditCard
} from 'lucide-react';
import { getInitials } from '@/lib/formatters';

export default function MorePage() {
  const { customer, user, isOwner, orgRole, signOut, providers } = useAuth();
  const navigate = useNavigate();

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile', path: '/profile', testId: 'menu-profile' },
        { icon: CreditCard, label: 'Payees', path: '/payees', testId: 'menu-payees' },
        { icon: Users, label: 'Team Members', path: '/team', testId: 'menu-team', hide: !isOwner && orgRole !== 'org_admin' },
      ],
    },
    {
      title: 'Security',
      items: [
        { icon: Shield, label: 'MFA Settings', path: '/mfa-settings', testId: 'menu-mfa' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', path: '#', testId: 'menu-help' },
        { icon: FileText, label: 'Terms of Service', path: '#', testId: 'menu-terms' },
      ],
    },
  ];

  const displayName = customer?.first_name
    ? `${customer.first_name} ${customer.last_name || ''}`
    : customer?.business_name || user?.email || 'User';

  return (
    <div data-testid="more-page">
      <TopHeader title="More" />

      <div className="px-4 pt-5 space-y-6">
        {/* User Card */}
        <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
          <CardContent className="pt-5 pb-5 flex items-center gap-4">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarFallback className="bg-[hsl(var(--accent-teal)/0.12)] text-[hsl(var(--accent-teal))] font-semibold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" data-testid="user-display-name">{displayName}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] truncate mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-medium bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]">
                  {customer?.customer_type?.replace(/_/g, ' ') || 'Customer'}
                </Badge>
                {isOwner && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-medium bg-[hsl(var(--accent-teal)/0.08)] text-[hsl(var(--accent-teal))] border-[hsl(var(--accent-teal)/0.25)]">
                    Owner
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Provider Info */}
        {providers.length > 0 && (
          <div className="flex gap-3">
            {providers.map((p, i) => (
              <div
                key={i}
                className={`flex-1 rounded-xl border p-4 ${
                  p.provider === 'fiat_republic'
                    ? 'border-[hsl(var(--provider-eu)/0.25)] bg-[hsl(var(--provider-eu)/0.06)]'
                    : 'border-[hsl(var(--provider-us)/0.25)] bg-[hsl(var(--provider-us)/0.06)]'
                }`}
              >
                <p className={`text-xs font-medium ${
                  p.provider === 'fiat_republic' ? 'text-[hsl(var(--provider-eu))]' : 'text-[hsl(var(--provider-us))]'
                }`}>
                  {p.provider === 'fiat_republic' ? 'EU Rails' : 'US Rails'}
                </p>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">
                  {p.is_enabled ? 'Connected' : 'Disabled'}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Menu Sections */}
        {menuSections.map((section, si) => (
          <div key={si}>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-medium mb-2 uppercase tracking-widest">
              {section.title}
            </p>
            <div className="rounded-xl border border-[hsl(var(--border))] overflow-hidden divide-y divide-[hsl(var(--border))]">
              {section.items
                .filter(item => !item.hide)
                .map((item, ii) => (
                  <button
                    key={ii}
                    data-testid={item.testId}
                    onClick={() => item.path !== '#' && navigate(item.path)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-4 bg-[hsl(var(--surface-1))] hover:bg-[hsl(var(--accent))] active:bg-[hsl(var(--accent)/0.7)] transition-colors duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  </button>
                ))}
            </div>
          </div>
        ))}

        {/* Sign Out */}
        <Button
          variant="destructive"
          className="w-full h-12 font-semibold"
          data-testid="sign-out-button"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>

        {/* Customer ID */}
        {customer?.id && (
          <p className="text-center text-[10px] text-[hsl(var(--text-3))] pb-4">
            Customer ID: {customer.id}
          </p>
        )}
      </div>
    </div>
  );
}
