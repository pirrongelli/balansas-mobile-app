import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { TopHeader } from '@/components/layout/TopHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, UserPlus, MoreVertical, AlertCircle } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { getInitials } from '@/lib/formatters';
import { toast } from 'sonner';

export default function TeamPage() {
  const { customer, isOwner, orgRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [members, setMembers] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', firstName: '', lastName: '', role: 'viewer' });
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const canManage = isOwner || orgRole === 'org_admin';

  const fetchMembers = useCallback(async () => {
    if (!customer?.id) return;
    try {
      setError(null);
      const { data: roles } = await supabase
        .from('org_roles')
        .select('*, profiles(*)')
        .eq('customer_id', customer.id);
      setMembers(roles || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [customer?.id]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleInvite = async () => {
    if (!inviteForm.email) {
      setInviteError('Email is required');
      return;
    }
    setIsInviting(true);
    setInviteError('');
    try {
      const { error: invErr } = await supabase.functions.invoke('create-platform-user', {
        body: {
          email: inviteForm.email,
          firstName: inviteForm.firstName,
          lastName: inviteForm.lastName,
          role: inviteForm.role,
          customerId: customer.id,
        },
      });
      if (invErr) throw invErr;
      toast.success('Invitation sent');
      setShowInvite(false);
      setInviteForm({ email: '', firstName: '', lastName: '', role: 'viewer' });
      fetchMembers();
    } catch (err) {
      setInviteError(err.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleToggleStatus = async (userId, action) => {
    try {
      const { error: toggleErr } = await supabase.functions.invoke('toggle-user-status', {
        body: { userId, action },
      });
      if (toggleErr) throw toggleErr;
      toast.success(`User ${action}d successfully`);
      fetchMembers();
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      org_admin: 'bg-[hsl(var(--accent-teal)/0.12)] text-[hsl(var(--accent-teal))] border-[hsl(var(--accent-teal)/0.25)]',
      editor: 'bg-[hsl(var(--status-warning)/0.12)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.25)]',
      approver: 'bg-[hsl(var(--provider-us)/0.12)] text-[hsl(var(--provider-us))] border-[hsl(var(--provider-us)/0.25)]',
      viewer: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]',
    };
    return colors[role] || colors.viewer;
  };

  if (loading) return (
    <>
      <TopHeader title="Team Members" showBack />
      <div className="px-4 pt-4 space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    </>
  );

  if (error) return (
    <>
      <TopHeader title="Team Members" showBack />
      <ErrorState message={error} onRetry={fetchMembers} />
    </>
  );

  return (
    <div data-testid="team-page">
      <TopHeader
        title="Team Members"
        showBack
        rightAction={
          canManage ? (
            <Button
              variant="ghost"
              size="icon"
              data-testid="invite-member-button"
              onClick={() => setShowInvite(true)}
              className="h-9 w-9 rounded-full"
            >
              <UserPlus className="h-5 w-5" />
            </Button>
          ) : null
        }
      />

      <div className="px-4 pt-4 space-y-3">
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          {members.length} member{members.length !== 1 ? 's' : ''}
        </p>

        {members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No team members"
            description="Invite team members to collaborate"
            actionLabel={canManage ? 'Invite Member' : undefined}
            onAction={canManage ? () => setShowInvite(true) : undefined}
          />
        ) : (
          <div className="space-y-2">
            {members.map((member, i) => (
              <div
                key={member.id || i}
                data-testid={`team-member-${i}`}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 bg-[hsl(var(--surface-1))] border border-[hsl(var(--border))]"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-[hsl(var(--surface-2))] text-xs font-bold">
                      {getInitials(member.profiles?.email || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.profiles?.email || 'User'}
                    </p>
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${getRoleColor(member.role)}`}>
                      {(member.role || 'viewer').replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
                {canManage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggleStatus(member.user_id, 'disable')}>
                        Disable
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(member.user_id, 'enable')}>
                        Enable
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-[400px] bg-[hsl(var(--card))] border-[hsl(var(--border))]">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>Send an invitation to join your organization</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {inviteError && (
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--status-danger))] bg-[hsl(var(--status-danger)/0.08)] rounded-lg px-3 py-2">
                <AlertCircle className="h-4 w-4" />
                {inviteError}
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-sm">Email</Label>
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm(f => ({ ...f, email: e.target.value }))}
                className="h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]"
                data-testid="invite-email-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">First Name</Label>
                <Input
                  placeholder="John"
                  value={inviteForm.firstName}
                  onChange={(e) => setInviteForm(f => ({ ...f, firstName: e.target.value }))}
                  className="h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Last Name</Label>
                <Input
                  placeholder="Doe"
                  value={inviteForm.lastName}
                  onChange={(e) => setInviteForm(f => ({ ...f, lastName: e.target.value }))}
                  className="h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Role</Label>
              <Select value={inviteForm.role} onValueChange={(v) => setInviteForm(f => ({ ...f, role: v }))}>
                <SelectTrigger className="h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer - Read only</SelectItem>
                  <SelectItem value="editor">Editor - Create & manage</SelectItem>
                  <SelectItem value="approver">Approver - Approve payments</SelectItem>
                  <SelectItem value="org_admin">Admin - Full access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleInvite}
              disabled={isInviting || !inviteForm.email}
              className="w-full h-11 font-semibold"
              data-testid="invite-submit-button"
            >
              {isInviting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
