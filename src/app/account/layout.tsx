import { AccountShell } from "@/components/account/AccountShell";

/** One persistent shell for every account tab, so the menu never re-mounts or flashes when switching tabs. */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
