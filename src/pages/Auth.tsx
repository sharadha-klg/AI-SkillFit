import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, ArrowLeft } from "lucide-react";
import { getUserRole } from "@/lib/auth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const DIVISIONS = ["Engineering", "Product", "Sales", "Marketing", "Operations", "HR", "Finance"];

const Auth = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const role = (params.get("role") === "admin" ? "admin" : "candidate") as "candidate" | "admin";
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [adminId, setAdminId] = useState("");
  const [organization, setOrganization] = useState("");
  const [division, setDivision] = useState("");
  const [careerGap, setCareerGap] = useState("");

  const [otpStage, setOtpStage] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpInput, setOtpInput] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const r = await getUserRole(data.session.user.id);
        navigate(r === "admin" ? "/admin" : "/dashboard");
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    const r = await getUserRole(data.user.id);
    if (r !== role) {
      toast.error(t("auth.wrongRole", { role: r }));
      await supabase.auth.signOut();
      return;
    }
    toast.success(t("auth.welcomeBack"));
    navigate(r === "admin" ? "/admin" : "/dashboard");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "candidate" && !/^\d{10}$/.test(phone)) return toast.error(t("auth.phoneInvalid"));
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { role, first_name: firstName, last_name: lastName, phone,
          candidate_id: candidateId || null, admin_id: adminId || null,
          organization: organization || null, division: division || null, career_gap: careerGap || null },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(otp);
    setOtpStage(true);
    toast.success(t("auth.otpToast", { otp }), { duration: 15000, description: t("auth.otpSub") });
  };

  const verifyOtp = () => {
    if (otpInput === generatedOtp) {
      toast.success(t("auth.otpVerified"));
      setOtpStage(false); setTab("login");
    } else toast.error(t("auth.otpInvalid"));
  };

  if (otpStage) {
    return (
      <div className="min-h-screen app-shell flex items-center justify-center px-6 py-12">
        <Card className="glass-card p-8 max-w-md w-full animate-fade-up">
          <h2 className="text-2xl font-bold mb-2">{t("auth.otpTitle")}</h2>
          <p className="text-sm text-muted-foreground mb-6">{t("auth.otpDesc")}</p>
          <Input value={otpInput} onChange={(e) => setOtpInput(e.target.value)} placeholder={t("auth.otpPh")} maxLength={6} className="text-center text-2xl tracking-widest mb-4" />
          <Button className="w-full" onClick={verifyOtp}>{t("auth.verify")}</Button>
          <button className="text-xs text-muted-foreground mt-4 underline" onClick={() => toast.info(`OTP: ${generatedOtp}`)}>{t("auth.showOtp")}</button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-shell flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> {t("nav.back")}
          </Link>
          <LanguageSwitcher />
        </div>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary via-accent/80 to-primary flex items-center justify-center glow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">{t("brand")}</span>
          <span className="ml-auto text-xs px-3 py-1 rounded-full border border-border bg-card/80 capitalize">{t("auth.portal", { role })}</span>
        </div>

        <Card className="glass-card p-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
            <TabsList className="grid grid-cols-2 w-full mb-6 bg-secondary/70 border border-border">
              <TabsTrigger value="login">{t("auth.login")}</TabsTrigger>
              <TabsTrigger value="signup">{t("auth.signup")}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div><Label>{t("auth.email")}</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div><Label>{t("auth.password")}</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? t("auth.signing") : t("auth.signin")}</Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>{t("auth.firstName")}</Label><Input required value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
                  <div><Label>{t("auth.lastName")}</Label><Input required value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
                </div>
                <div><Label>{role === "admin" ? t("auth.workEmail") : t("auth.email")}</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div><Label>{t("auth.phone")}</Label><Input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} maxLength={10} required /></div>
                {role === "candidate" ? (
                  <>
                    <div><Label>{t("auth.candidateId")}</Label><Input value={candidateId} onChange={(e) => setCandidateId(e.target.value)} required /></div>
                    <div><Label>{t("auth.careerGap")}</Label><Input value={careerGap} onChange={(e) => setCareerGap(e.target.value)} placeholder={t("auth.careerGapPh")} /></div>
                  </>
                ) : (
                  <>
                    <div><Label>{t("auth.organization")}</Label><Input value={organization} onChange={(e) => setOrganization(e.target.value)} required /></div>
                    <div><Label>{t("auth.adminId")}</Label><Input value={adminId} onChange={(e) => setAdminId(e.target.value)} required /></div>
                    <div>
                      <Label>{t("auth.division")}</Label>
                      <Select value={division} onValueChange={setDivision}>
                        <SelectTrigger><SelectValue placeholder={t("auth.selectDivision")} /></SelectTrigger>
                        <SelectContent>{DIVISIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <div><Label>{t("auth.password")}</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? t("auth.creating") : t("auth.create")}</Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
