import { ChatInterface } from "@/components/chat/chat-interface";
import { QualtricsSettings } from "@/components/settings/qualtrics-settings";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, CreditCard, Database } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AccountPage from "./account-page";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Survey Builder
          </h1>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setAccountOpen(true)}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Account & Billing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  <Database className="mr-2 h-4 w-4" />
                  Qualtrics Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Welcome Message */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-2">
              Welcome, {user?.username}!
            </h2>
            <p className="text-muted-foreground">
              {!user?.qualtricsApiToken ? (
                "Please configure your Qualtrics credentials in settings to get started."
              ) : (
                "Describe your survey requirements and let AI handle the rest."
              )}
            </p>
          </div>

          {/* Token Balance */}
          {/* <div className="mb-8 text-center">
            <div className="inline-block px-4 py-2 bg-primary/10 rounded-lg">
              <span className="text-sm font-medium">
                Available Tokens: {user?.tokenBalance}
              </span>
            </div>
          </div> */}

          {/* Chat Interface */}
          <ChatInterface />
        </div>
      </main>

      {/* Qualtrics Settings Sheet */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Qualtrics Settings</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <QualtricsSettings />
          </div>
        </SheetContent>
      </Sheet>

      {/* Account Sheet */}
      <Sheet open={accountOpen} onOpenChange={setAccountOpen}>
        <SheetContent className="w-full sm:max-w-xl flex flex-col h-full">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>Account & Billing</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto mt-4 pr-6">
            <AccountPage />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}