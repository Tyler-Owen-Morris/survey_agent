import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function SubscriptionForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/`,
        },
      });

      if (error) {
        throw error;
      }

      // Payment successful
      toast({
        title: "Subscription Activated",
        description: "Your subscription has been activated successfully. You will receive 20,000 tokens monthly.",
      });

      // Refresh user data to get updated token balance
      queryClient.invalidateQueries(["/api/user"]);
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button className="w-full mt-4" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Subscribe - $20/month"
        )}
      </Button>
    </form>
  );
}

function TokenPurchaseForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/`,
        },
      });

      if (error) {
        throw error;
      }

      // Payment successful
      toast({
        title: "Tokens Purchased",
        description: "Your payment was successful. 10,000 tokens have been added to your account.",
      });

      // Refresh user data to get updated token balance
      queryClient.invalidateQueries(["/api/user"]);
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button className="w-full mt-4" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Purchase Tokens - $10"
        )}
      </Button>
    </form>
  );
}

export default function AccountPage() {
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState("");
  const [purchaseType, setPurchaseType] = useState<"subscription" | "tokens" | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (purchaseType) {
      apiRequest("POST", "/api/create-payment-intent", {
        type: purchaseType,
        amount: purchaseType === "subscription" ? 2000 : 1000, // $20 or $10 in cents
      })
        .then((res) => res.json())
        .then((data) => setClientSecret(data.clientSecret))
        .catch((error) => {
          toast({
            title: "Error",
            description: "Failed to initialize payment. Please try again.",
            variant: "destructive",
          });
          setPurchaseType(null);
        });
    }
  }, [purchaseType, toast]);

  return (
    <div className="space-y-8">
      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Your current token balance and subscription status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>Available Tokens: {user?.tokenBalance}</p>
            <p>Subscription Status: Free Plan</p>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Options */}
      {!purchaseType ? (
        <div className="grid gap-4">
          {/* Subscription Card */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Subscription</CardTitle>
              <CardDescription>
                Get 20,000 tokens per month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setPurchaseType("subscription")}
              >
                Subscribe for $20/month
              </Button>
            </CardContent>
          </Card>

          {/* One-time Purchase Card */}
          <Card>
            <CardHeader>
              <CardTitle>One-time Token Purchase</CardTitle>
              <CardDescription>
                Get 10,000 tokens instantly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setPurchaseType("tokens")}
              >
                Purchase for $10
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {purchaseType === "subscription" ? "Subscribe" : "Purchase Tokens"}
            </CardTitle>
            <CardDescription>
              {purchaseType === "subscription" 
                ? "Get 20,000 tokens per month" 
                : "Get 10,000 tokens instantly"}
            </CardDescription>
            <Button 
              variant="ghost" 
              className="mt-2"
              onClick={() => setPurchaseType(null)}
            >
              ← Back to options
            </Button>
          </CardHeader>
          <CardContent>
            {clientSecret && (
              <Elements 
                stripe={stripePromise} 
                options={{ clientSecret }}
              >
                {purchaseType === "subscription" 
                  ? <div className="space-y-4 pb-4">
                      <SubscriptionForm />
                    </div>
                  : <div className="space-y-4 pb-4">
                      <TokenPurchaseForm />
                    </div>
                }
              </Elements>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}