import { ChatInterface } from "@/components/chat/chat-interface";
import { QualtricsSettings } from "@/components/settings/qualtrics-settings";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Survey Builder
          </h1>
          <div className="flex items-center gap-4">
            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline">Settings</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Settings</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <QualtricsSettings />
                </div>
              </SheetContent>
            </Sheet>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-5 w-5" />
            </Button>
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
          <div className="mb-8 text-center">
            <div className="inline-block px-4 py-2 bg-primary/10 rounded-lg">
              <span className="text-sm font-medium">
                Available Tokens: {user?.tokenBalance}
              </span>
            </div>
          </div>

          {/* Chat Interface */}
          <ChatInterface />
        </div>
      </main>
    </div>
  );
}
