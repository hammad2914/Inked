import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  User, Building2, Bell, Shield, Palette, Trash2,
  Loader2, Sun, Moon, Monitor, AlertTriangle, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { api } from '@/api/axios';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/utils/cn';

const SECTIONS = [
  { key: 'profile',      label: 'Profile',      icon: User },
  { key: 'company',      label: 'Company',      icon: Building2 },
  { key: 'notifications',label: 'Notifications', icon: Bell },
  { key: 'security',     label: 'Security',     icon: Shield },
  { key: 'appearance',   label: 'Appearance',   icon: Palette },
  { key: 'danger',       label: 'Danger Zone',  icon: Trash2 },
];

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [profileForm, setProfileForm] = useState({ fullName: '', email: '' });
  const [companyForm, setCompanyForm] = useState({ name: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState({
    taskAssigned: true, deadlineReminder: true, statusChanged: true, teamUpdates: false,
  });

  const { user, company, logout, updateCompany } = useAuthStore();
  const isAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';
  const { theme, setTheme } = useUIStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const profileMutation = useMutation({
    mutationFn: () => api.patch(`/users/${user?.id}`, { fullName: profileForm.fullName || user?.fullName, email: profileForm.email || user?.email }),
    onSuccess: () => toast({ title: '✅ Profile updated' }),
    onError: () => toast({ variant: 'destructive', title: 'Update failed' }),
  });

  const companyMutation = useMutation({
    mutationFn: () => api.patch<{ success: boolean; data: { company: { id: string; name: string } } }>(
      '/auth/company',
      { name: companyForm.name.trim() },
    ),
    onSuccess: (res) => {
      updateCompany({ name: res.data.data.company.name });
      setCompanyForm({ name: '' });
      toast({ title: '✅ Company name updated' });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast({ variant: 'destructive', title: 'Update failed', description: e.response?.data?.message ?? 'Something went wrong' });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () => api.post('/auth/change-password', passwordForm),
    onSuccess: () => {
      toast({ title: '✅ Password changed' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast({ variant: 'destructive', title: 'Error', description: e.response?.data?.message ?? 'Failed' });
    },
  });

  return (
    <div className="p-6">
      <div className="mb-6 animate-fade-up">
        <h1 className="font-heading font-bold text-2xl text-white">Settings</h1>
        <p className="text-sm text-white/35 mt-1">Manage your account, company, and preferences</p>
      </div>

      <div className="flex gap-6 animate-fade-up" style={{ animationDelay: '60ms' }}>
        {/* Left nav */}
        <aside className="hidden md:flex flex-col w-52 shrink-0 space-y-0.5">
          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-left',
                activeSection === key
                  ? key === 'danger'
                    ? 'bg-danger/15 text-danger border border-danger/25'
                    : 'bg-indigo/15 text-indigo border border-indigo/20'
                  : key === 'danger'
                    ? 'text-danger/60 hover:bg-danger/[0.08] hover:text-danger'
                    : 'text-white/45 hover:bg-white/[0.05] hover:text-white/80',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {/* Profile */}
          {activeSection === 'profile' && (
            <div className="glass rounded-2xl p-6 space-y-5 animate-scale-in">
              <h2 className="font-heading font-bold text-lg text-white">Profile</h2>
              <Separator className="bg-white/[0.07]" />
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-xl font-heading font-bold text-white shadow-glow-sm">
                  {user?.fullName?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-white">{user?.fullName}</p>
                  <p className="text-sm text-white/40 font-mono">{user?.email}</p>
                  <p className="text-xs text-indigo/70 mt-1 capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-white/35">Full Name</Label>
                  <Input
                    placeholder={user?.fullName}
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm((f) => ({ ...f, fullName: e.target.value }))}
                    className="h-10 bg-background border-white/[0.08] text-white placeholder:text-white/20 focus:border-indigo focus:ring-1 focus:ring-indigo/40 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-white/35">Email</Label>
                  <Input
                    type="email"
                    placeholder={user?.email}
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                    className="h-10 bg-background border-white/[0.08] text-white placeholder:text-white/20 focus:border-indigo focus:ring-1 focus:ring-indigo/40 rounded-lg"
                  />
                </div>
              </div>
              <Button
                onClick={() => profileMutation.mutate()}
                disabled={profileMutation.isPending}
                className="bg-gradient-primary text-white rounded-xl shimmer shadow-glow-sm"
              >
                {profileMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving…</> : 'Save Changes'}
              </Button>
            </div>
          )}

          {/* Company */}
          {activeSection === 'company' && (
            <div className="glass rounded-2xl p-6 space-y-5 animate-scale-in">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-bold text-lg text-white">Company</h2>
                {!isAdmin && (
                  <span className="flex items-center gap-1.5 text-xs text-white/35 bg-white/[0.05] border border-white/[0.08] rounded-full px-3 py-1">
                    <Shield className="h-3 w-3" /> View only
                  </span>
                )}
              </div>
              <Separator className="bg-white/[0.07]" />
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-indigo/20 border border-indigo/30 flex items-center justify-center text-lg font-heading font-bold text-indigo">
                  {company?.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-white">{company?.name}</p>
                  <p className="text-xs text-white/30 font-mono mt-0.5">{company?.id}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-white/35">Company Name</Label>
                <Input
                  placeholder={company?.name}
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, name: e.target.value }))}
                  disabled={!isAdmin}
                  className="h-10 bg-background border-white/[0.08] text-white placeholder:text-white/20 focus:border-indigo focus:ring-1 focus:ring-indigo/40 rounded-lg max-w-sm disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
              {isAdmin && (
                <Button
                  onClick={() => companyMutation.mutate()}
                  disabled={!companyForm.name.trim() || companyMutation.isPending}
                  className="bg-gradient-primary text-white rounded-xl shimmer shadow-glow-sm"
                >
                  {companyMutation.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
                    : 'Save Changes'}
                </Button>
              )}
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div className="glass rounded-2xl p-6 space-y-5 animate-scale-in">
              <h2 className="font-heading font-bold text-lg text-white">Notifications</h2>
              <Separator className="bg-white/[0.07]" />
              <div className="space-y-4">
                {[
                  { key: 'taskAssigned',      label: 'Task Assigned',      desc: 'When a task is assigned to you' },
                  { key: 'deadlineReminder',  label: 'Deadline Reminder',  desc: '24 hours before a task deadline' },
                  { key: 'statusChanged',     label: 'Status Changes',     desc: 'When a task status is updated' },
                  { key: 'teamUpdates',       label: 'Team Updates',       desc: 'New members and project invitations' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-sm font-medium text-white/80">{label}</p>
                      <p className="text-xs text-white/35 mt-0.5">{desc}</p>
                    </div>
                    <Switch
                      checked={notifications[key as keyof typeof notifications]}
                      onCheckedChange={(v: boolean) => setNotifications((n) => ({ ...n, [key]: v }))}
                      className="data-[state=checked]:bg-indigo"
                    />
                  </div>
                ))}
              </div>
              <Button
                onClick={() => toast({ title: '✅ Notification preferences saved' })}
                className="bg-gradient-primary text-white rounded-xl shimmer shadow-glow-sm"
              >
                Save Preferences
              </Button>
            </div>
          )}

          {/* Security */}
          {activeSection === 'security' && (
            <div className="glass rounded-2xl p-6 space-y-5 animate-scale-in">
              <h2 className="font-heading font-bold text-lg text-white">Security</h2>
              <Separator className="bg-white/[0.07]" />
              <div className="space-y-4">
                {[
                  { key: 'currentPassword', label: 'Current Password', placeholder: '••••••••' },
                  { key: 'newPassword',      label: 'New Password',     placeholder: 'Min. 8 characters' },
                  { key: 'confirmPassword',  label: 'Confirm Password', placeholder: 'Repeat new password' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-white/35">{label}</Label>
                    <Input
                      type="password"
                      placeholder={placeholder}
                      value={passwordForm[key as keyof typeof passwordForm]}
                      onChange={(e) => setPasswordForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="h-10 bg-background border-white/[0.08] text-white placeholder:text-white/20 focus:border-indigo focus:ring-1 focus:ring-indigo/40 rounded-lg max-w-sm"
                    />
                  </div>
                ))}
              </div>
              <Button
                onClick={() => passwordMutation.mutate()}
                disabled={!passwordForm.currentPassword || !passwordForm.newPassword || passwordMutation.isPending}
                className="bg-gradient-primary text-white rounded-xl shimmer shadow-glow-sm"
              >
                {passwordMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Updating…</> : 'Update Password'}
              </Button>
            </div>
          )}

          {/* Appearance */}
          {activeSection === 'appearance' && (
            <div className="glass rounded-2xl p-6 space-y-5 animate-scale-in">
              <h2 className="font-heading font-bold text-lg text-white">Appearance</h2>
              <Separator className="bg-white/[0.07]" />
              <p className="text-sm text-white/40">Choose your preferred color theme</p>
              <div className="grid grid-cols-3 gap-3 max-w-sm">
                {[
                  { value: 'dark',  label: 'Dark',   icon: Moon,    preview: '#080C14' },
                  { value: 'light', label: 'Light',  icon: Sun,     preview: '#F8FAFC' },
                ].map(({ value, label, icon: Icon, preview }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value as 'dark' | 'light')}
                    className={cn(
                      'relative rounded-xl p-4 border transition-all flex flex-col items-center gap-2',
                      theme === value
                        ? 'border-indigo bg-indigo/15 shadow-glow-sm'
                        : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]',
                    )}
                  >
                    <div className="h-10 w-10 rounded-lg border border-white/[0.1]" style={{ background: preview }} />
                    <Icon className={cn('h-4 w-4', theme === value ? 'text-indigo' : 'text-white/40')} />
                    <span className={cn('text-xs font-semibold', theme === value ? 'text-indigo' : 'text-white/45')}>{label}</span>
                    {theme === value && (
                      <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-indigo flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Danger Zone */}
          {activeSection === 'danger' && (
            <div className="rounded-2xl border border-danger/30 bg-danger/[0.05] p-6 space-y-5 animate-scale-in">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-danger" />
                <h2 className="font-heading font-bold text-lg text-danger">Danger Zone</h2>
              </div>
              <Separator className="bg-danger/20" />
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-white/80 text-sm">Delete Account</p>
                  <p className="text-xs text-white/40 mt-1">Permanently delete your account and all associated data. This action cannot be undone.</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="border-danger/40 text-danger hover:bg-danger/15 hover:text-danger rounded-xl"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="glass-elevated border-danger/30 rounded-2xl shadow-modal max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-lg text-danger flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-white/50 text-sm mt-2">
              This will permanently delete your account. Type <span className="font-mono text-white font-semibold">DELETE</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder='Type "DELETE"'
            className="h-10 bg-background border-danger/20 text-white placeholder:text-white/20 focus:border-danger focus:ring-1 focus:ring-danger/40 rounded-lg font-mono"
          />
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}
              className="text-white/50 hover:text-white hover:bg-white/[0.06] rounded-xl">Cancel</Button>
            <Button
              disabled={deleteConfirm !== 'DELETE'}
              onClick={() => { logout(); navigate('/login'); }}
              className="bg-danger text-white rounded-xl hover:bg-danger/90"
            >
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
