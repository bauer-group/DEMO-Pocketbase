import { useState, type FormEvent } from "react";
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Users,
  FileStack,
  Webhook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getErrorMessage } from "@/lib/errors";
import { useToast } from "@/providers/ToastProvider";

interface AuthScreenProps {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
}

const FEATURES = [
  { icon: Users, label: "Membership-RLS", text: "Echte Mehrbenutzer-Zugriffsregeln" },
  { icon: Zap, label: "Realtime", text: "Live-Updates über WebSocket" },
  { icon: FileStack, label: "Datei-Uploads", text: "Anhänge & Thumbnails" },
  { icon: Webhook, label: "Event-Hooks", text: "Serverseitiger Activity-Feed" },
];

export function AuthScreen({ login, register }: AuthScreenProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("demo1234");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, name || email.split("@")[0]);
        toast({ title: "Konto erstellt", variant: "success" });
      }
    } catch (err) {
      toast({ title: "Anmeldung fehlgeschlagen", description: getErrorMessage(err), variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Hero / Branding */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-violet-800 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl" />

        <div className="relative flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-6 w-6" />
          Collab Workspace
        </div>

        <div className="relative">
          <h1 className="max-w-md text-4xl font-bold leading-tight">
            Ein Backend. <br /> Die volle Bandbreite von PocketBase.
          </h1>
          <p className="mt-4 max-w-md text-white/80">
            Kollaborative Workspaces mit Realtime, relationaler Zugriffskontrolle,
            Datei-Uploads, Event-Hooks und Custom-API – in einer einzigen Binary.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur"
              >
                <f.icon className="h-5 w-5" />
                <div className="mt-2 text-sm font-semibold">{f.label}</div>
                <div className="text-xs text-white/70">{f.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-sm text-white/70">
          <ShieldCheck className="h-4 w-4" /> Demo-Umgebung · keine echten Daten
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col items-center justify-center p-6">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>

        <Card className="w-full max-w-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {mode === "login" ? "Willkommen zurück" : "Konto erstellen"}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {mode === "login"
              ? "Melde dich an, um deine Workspaces zu öffnen."
              : "Lege ein neues Konto an und starte sofort."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "register" && (
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-300">
                  Name
                </span>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dein Name"
                  autoComplete="name"
                />
              </label>
            )}
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-300">
                E-Mail
              </span>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-700 dark:text-slate-300">
                Passwort
              </span>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </label>

            <Button type="submit" loading={loading} className="w-full">
              {mode === "login" ? "Anmelden" : "Registrieren"}
            </Button>
          </form>

          <div className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
            Demo-Login ist vorausgefüllt: <strong>demo@example.com</strong> / demo1234
          </div>

          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            {mode === "login" ? "Noch kein Konto? " : "Bereits registriert? "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              {mode === "login" ? "Registrieren" : "Anmelden"}
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
}
