import { Link } from 'wouter';
import { Show, useClerk, useUser } from '@clerk/react';
import { PageShell } from '@/components/PageShell';
import { LogOut, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useSettings,
  type FontSize,
  type Theme,
  type SnippetLength,
  type AccentColor,
} from '@/lib/settings';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="font-display font-semibold text-foreground mb-1">{title}</h2>
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SettingRow({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-foreground font-medium cursor-pointer">
          {label}
        </Label>
        {hint && <p className="text-sm text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} className="flex-shrink-0 mt-0.5" />
    </div>
  );
}

const ACCENT_OPTIONS: { value: AccentColor; label: string; from: string; to: string }[] = [
  { value: 'sunset', label: 'Sunset', from: '#f97316', to: '#a855f7' },
  { value: 'ocean',  label: 'Ocean',  from: '#0ea5e9', to: '#3b82f6' },
  { value: 'forest', label: 'Forest', from: '#22c55e', to: '#14b8a6' },
  { value: 'aurora', label: 'Aurora', from: '#a855f7', to: '#06b6d4' },
];

function AppearanceSection() {
  const { settings, setSetting } = useSettings();

  return (
    <SettingsCard title="Appearance" description="Choose how Sercaw looks on this device.">
      {/* Theme */}
      <div>
        <Label className="text-foreground font-medium mb-2 block">Theme</Label>
        <RadioGroup
          value={settings.theme}
          onValueChange={(v) => setSetting('theme', v as Theme)}
          className="flex flex-wrap gap-4"
        >
          {(['light', 'dark', 'system'] as Theme[]).map((theme) => (
            <div key={theme} className="flex items-center gap-2">
              <RadioGroupItem value={theme} id={`theme-${theme}`} />
              <Label htmlFor={`theme-${theme}`} className="capitalize cursor-pointer font-normal">
                {theme}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Accent color */}
      <div className="border-t border-border pt-4">
        <Label className="text-foreground font-medium mb-3 block">Accent color</Label>
        <div className="flex items-center gap-3">
          {ACCENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              title={opt.label}
              onClick={() => setSetting('accentColor', opt.value)}
              className={cn(
                'w-8 h-8 rounded-full transition-all',
                settings.accentColor === opt.value
                  ? 'ring-2 ring-offset-2 ring-foreground scale-110'
                  : 'hover:scale-105 opacity-80 hover:opacity-100',
              )}
              style={{
                background: `linear-gradient(135deg, ${opt.from}, ${opt.to})`,
              }}
              aria-label={opt.label}
            />
          ))}
          <span className="text-sm text-muted-foreground ml-1 capitalize">
            {settings.accentColor}
          </span>
        </div>
      </div>

      {/* Compact results */}
      <div className="border-t border-border pt-4">
        <SettingRow
          id="compact-results"
          label="Compact results"
          hint="Shows search results closer together with smaller titles."
          checked={settings.compactResults}
          onCheckedChange={(v) => setSetting('compactResults', v)}
        />
      </div>
    </SettingsCard>
  );
}

function AccessibilitySection() {
  const { settings, setSetting } = useSettings();

  return (
    <SettingsCard
      title="Accessibility"
      description="Adjust text size, motion, and contrast to make Sercaw easier to use."
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <Label htmlFor="font-size" className="text-foreground font-medium">
            Text size
          </Label>
          <p className="text-sm text-muted-foreground mt-0.5">
            Scales text throughout the app.
          </p>
        </div>
        <Select
          value={settings.fontSize}
          onValueChange={(v) => setSetting('fontSize', v as FontSize)}
        >
          <SelectTrigger id="font-size" className="w-36 flex-shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="md">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
            <SelectItem value="xl">Extra large</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border-t border-border pt-4">
        <SettingRow
          id="reduce-motion"
          label="Reduce motion"
          hint="Turns off animations and transitions."
          checked={settings.reduceMotion}
          onCheckedChange={(v) => setSetting('reduceMotion', v)}
        />
      </div>

      <div className="border-t border-border pt-4">
        <SettingRow
          id="high-contrast"
          label="High contrast"
          hint="Strengthens borders, text, and focus outlines."
          checked={settings.highContrast}
          onCheckedChange={(v) => setSetting('highContrast', v)}
        />
      </div>

      <div className="border-t border-border pt-4">
        <SettingRow
          id="underline-links"
          label="Underline links"
          hint="Makes links visible without relying on color alone."
          checked={settings.underlineLinks}
          onCheckedChange={(v) => setSetting('underlineLinks', v)}
        />
      </div>
    </SettingsCard>
  );
}

function SearchBehaviorSection() {
  const { settings, setSetting } = useSettings();

  return (
    <SettingsCard title="Search behavior" description="Control how search results look and behave.">
      <SettingRow
        id="new-tab"
        label="Open results in a new tab"
        hint="Search result links open in a new tab instead of navigating away."
        checked={settings.openResultsInNewTab}
        onCheckedChange={(v) => setSetting('openResultsInNewTab', v)}
      />

      <div className="border-t border-border pt-4">
        <SettingRow
          id="show-ai-overview"
          label="Show AI Overview"
          hint="Featherpilot's AI-generated summary appears above search results."
          checked={settings.showAiOverview}
          onCheckedChange={(v) => setSetting('showAiOverview', v)}
        />
      </div>

      <div className="border-t border-border pt-4">
        <SettingRow
          id="sticky-header"
          label="Sticky search bar"
          hint="Keeps the search bar pinned to the top when scrolling through results."
          checked={settings.stickyHeader}
          onCheckedChange={(v) => setSetting('stickyHeader', v)}
        />
      </div>

      <div className="border-t border-border pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Label className="text-foreground font-medium">Snippet length</Label>
            <p className="text-sm text-muted-foreground mt-0.5">
              How many lines of each result's description to show.
            </p>
          </div>
          <Select
            value={settings.snippetLength}
            onValueChange={(v) => setSetting('snippetLength', v as SnippetLength)}
          >
            <SelectTrigger className="w-36 flex-shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short">Short (2 lines)</SelectItem>
              <SelectItem value="medium">Medium (4 lines)</SelectItem>
              <SelectItem value="full">Full text</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </SettingsCard>
  );
}

function ResetSection() {
  const { resetSettings } = useSettings();
  return (
    <button
      type="button"
      onClick={resetSettings}
      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <RotateCcw size={14} />
      Reset all settings to defaults
    </button>
  );
}

function AccountSection() {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-sunset-gradient text-white flex items-center justify-center font-bold text-xl overflow-hidden flex-shrink-0">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            (user?.firstName?.[0] ?? user?.primaryEmailAddress?.emailAddress?.[0] ?? 'S').toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">
            {user?.fullName || user?.username || 'Sercaw user'}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {user?.primaryEmailAddress?.emailAddress}
          </p>
        </div>
      </div>

      <SettingsCard title="Account" description="Manage your sign-in and account details.">
        <button
          type="button"
          onClick={() => signOut({ redirectUrl: basePath || '/' })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </SettingsCard>
    </>
  );
}

function SignedOutPrompt() {
  return (
    <div className="not-prose rounded-2xl border border-border bg-card p-6 sm:p-8 text-center">
      <p className="text-foreground mb-4">
        Sign in to sync your account details. Appearance and accessibility preferences below work
        whether or not you're signed in.
      </p>
      <Link
        href="/sign-in"
        className="inline-block px-5 py-2 rounded-full bg-sunset-gradient text-white text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Sign in
      </Link>
    </div>
  );
}

export default function Settings() {
  return (
    <PageShell title="Settings">
      <div className="not-prose space-y-6">
        <Show when="signed-in">
          <AccountSection />
        </Show>
        <Show when="signed-out">
          <SignedOutPrompt />
        </Show>

        <AppearanceSection />
        <AccessibilitySection />
        <SearchBehaviorSection />

        <ResetSection />
      </div>
    </PageShell>
  );
}
