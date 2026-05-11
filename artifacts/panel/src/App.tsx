import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import CreateServer from "@/pages/create-server";
import ServerDetail from "@/pages/server-detail";
import Plans from "@/pages/plans";
import NotFound from "@/pages/not-found";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#7c3aed",
    colorForeground: "#f4f4f5",
    colorMutedForeground: "#71717a",
    colorDanger: "#ef4444",
    colorBackground: "#0f0f12",
    colorInput: "#1c1c1f",
    colorInputForeground: "#f4f4f5",
    colorNeutral: "#27272a",
    fontFamily: "system-ui, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#0f0f12] border border-[#27272a] rounded-xl w-[440px] max-w-full overflow-hidden shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#f4f4f5] font-bold text-2xl",
    headerSubtitle: "text-[#71717a] text-sm",
    socialButtonsBlockButtonText: "text-[#f4f4f5] font-medium",
    formFieldLabel: "text-[#a1a1aa] text-sm font-medium",
    footerActionLink: "text-[#7c3aed] hover:text-[#8b5cf6] font-medium",
    footerActionText: "text-[#71717a]",
    dividerText: "text-[#52525b]",
    identityPreviewEditButton: "text-[#7c3aed]",
    formFieldSuccessText: "text-green-400",
    alertText: "text-[#f4f4f5]",
    logoBox: "flex justify-center py-2",
    logoImage: "h-10 w-10",
    socialButtonsBlockButton: "border border-[#27272a] bg-[#18181b] hover:bg-[#27272a] transition-colors",
    formButtonPrimary: "bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold transition-colors",
    formFieldInput: "bg-[#1c1c1f] border-[#27272a] text-[#f4f4f5] placeholder:text-[#52525b] focus:border-[#7c3aed] focus:ring-[#7c3aed]",
    footerAction: "border-t border-[#27272a] bg-[#0f0f12]",
    dividerLine: "bg-[#27272a]",
    alert: "border-[#27272a] bg-[#18181b]",
    otpCodeFieldInput: "border-[#27272a] bg-[#1c1c1f] text-[#f4f4f5]",
    formFieldRow: "gap-2",
    main: "gap-4",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        appearance={clerkAppearance}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        appearance={clerkAppearance}
      />
    </div>
  );
}

function HomeRoute() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsub = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsub;
  }, [addListener, qc]);

  return null;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomeRoute} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/plans" component={Plans} />
      <Route path="/dashboard">
        <Layout>
          <ProtectedRoute component={Dashboard} />
        </Layout>
      </Route>
      <Route path="/servers/new">
        <Layout>
          <ProtectedRoute component={CreateServer} />
        </Layout>
      </Route>
      <Route path="/servers/:id">
        <Layout>
          <ProtectedRoute component={ServerDetail} />
        </Layout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      {...({
        __internal_clerkJSUrl: `${window.location.origin}${basePath}/clerk/clerk.browser.js`,
        __internal_clerkUIUrl: `${window.location.origin}${basePath}/clerk-ui/ui.browser.js`,
      } as object)}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to your Vortex Hosting account",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Start hosting your Minecraft server today",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <AppRoutes />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
