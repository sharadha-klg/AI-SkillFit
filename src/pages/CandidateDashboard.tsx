import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, LogOut, Trophy, Clock, Award, MessageSquare, Brain, Briefcase, Video, Play } from "lucide-react";
import { PreAssessmentDialog } from "@/components/PreAssessmentDialog";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const CandidateDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ best: 0, count: 0, badges: 0 });
  const [openPre, setOpenPre] = useState(false);
  const [past, setPast] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) return navigate("/auth?role=candidate");
      const { data: p } = await supabase.from("profiles").select("*").eq("id", s.session.user.id).maybeSingle();
      setProfile(p);
      const { data: ass } = await supabase.from("assessments").select("*").eq("user_id", s.session.user.id).order("created_at", { ascending: false });
      const list = ass || [];
      setPast(list);
      const completed = list.filter((a) => a.fit_score != null);
      const best = completed.reduce((m, a) => Math.max(m, a.fit_score || 0), 0);
      setStats({ best, count: completed.length, badges: completed.filter((a) => (a.fit_score || 0) >= 75).length });
    })();
  }, [navigate]);

  const logout = async () => { await supabase.auth.signOut(); navigate("/"); };

  const modules = [
    { icon: MessageSquare, title: t("dashboard.m1"), desc: t("dashboard.m1d") },
    { icon: Brain, title: t("dashboard.m2"), desc: t("dashboard.m2d") },
    { icon: Briefcase, title: t("dashboard.m3"), desc: t("dashboard.m3d") },
    { icon: Video, title: t("dashboard.m4"), desc: t("dashboard.m4d") },
  ];

  return (
    <div className="min-h-screen app-shell">
      <nav className="container mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary via-accent/80 to-primary flex items-center justify-center glow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">{t("brand")}</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" onClick={logout}><LogOut className="w-4 h-4 mr-2" />{t("nav.logout")}</Button>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8 space-y-8">
        <div className="animate-fade-up">
          <h1 className="text-3xl md:text-4xl font-bold">{t("dashboard.hi", { name: profile?.first_name || "" })}</h1>
          <p className="text-muted-foreground mt-1">{t("dashboard.ready")}</p>
        </div>

        <Card className="glass-card p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 animate-fade-up">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t("dashboard.startTitle")}</h2>
            <p className="text-muted-foreground max-w-md">{t("dashboard.startDesc")}</p>
          </div>
          <Button size="lg" className="bg-gradient-to-r from-secondary via-accent to-primary text-primary-foreground glow animate-pulse-glow" onClick={() => setOpenPre(true)}>
            <Play className="w-5 h-5 mr-2" /> {t("dashboard.startNow")}
          </Button>
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Trophy, label: t("dashboard.fitScore"), value: stats.best ? `${stats.best}` : "—", color: "text-primary" },
            { icon: Clock, label: t("dashboard.taken"), value: stats.count, color: "text-accent" },
            { icon: Award, label: t("dashboard.badges"), value: stats.badges, color: "text-warning" },
          ].map((s, i) => (
            <Card key={i} className="glass-card p-6">
              <s.icon className={`w-7 h-7 ${s.color} mb-3`} />
              <div className="text-3xl font-bold">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </Card>
          ))}
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">{t("dashboard.modules")}</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {modules.map((m, i) => (
              <Card key={i} className="glass-card p-5 hover:scale-105 transition-smooth cursor-pointer">
                <m.icon className="w-7 h-7 text-primary mb-3" />
                <div className="font-semibold">{m.title}</div>
                <div className="text-sm text-muted-foreground">{m.desc}</div>
              </Card>
            ))}
          </div>
        </div>

        {past.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">{t("dashboard.yourInterviews")}</h2>
            <div className="space-y-2">
              {past.map((a) => (
                <Card key={a.id} className="glass-card p-4 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{a.job_role || t("dashboard.interview")}</div>
                    <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{a.fit_score ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{t(`status.${a.status}`)}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      <PreAssessmentDialog open={openPre} onOpenChange={setOpenPre} />
    </div>
  );
};

export default CandidateDashboard;
