'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { ChevronsUpDown, Languages, LogOut, Monitor, Moon, Sun } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { UserAvatar } from '@/components/user-avatar';
import { signOut } from '@/lib/auth/sign-out';
import { setLocale } from '@/lib/set-locale';

export function AccountMenu({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('account');
  const { theme, setTheme } = useTheme();
  const { isMobile } = useSidebar();
  const [, startTransition] = useTransition();

  const handleLanguage = () => {
    const next = locale === 'vi' ? 'en' : 'vi';
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  };

  const handleSignOut = () => {
    void signOut().then(() => {
      router.push('/login');
      router.refresh();
    });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar
                name={name}
                className="size-8 rounded-md"
                fallbackClassName="bg-sidebar-primary text-sidebar-primary-foreground rounded-md"
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="text-sidebar-foreground/70 truncate text-xs">{email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 opacity-70" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={8}
            className="w-56"
          >
            <DropdownMenuLabel className="text-muted-foreground truncate text-xs font-normal">
              {email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLanguage}>
              <Languages />
              {t('language')}
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Sun className="dark:hidden" />
                <Moon className="hidden dark:block" />
                {t('theme')}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                  <DropdownMenuRadioItem value="light">
                    <Sun />
                    {t('themeLight')}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    <Moon />
                    {t('themeDark')}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">
                    <Monitor />
                    {t('themeSystem')}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut />
              {t('signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
