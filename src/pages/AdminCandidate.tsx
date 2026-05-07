import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const AdminCandidate = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [a, setA] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: as } = await supabase.from("assessments").select("*").eq("id", id).maybeSingle();
      if (!as) return;
      const { data: prof } = await supabase.from("profiles").select("first_name, last_name, email, phone, candidate_id").eq("id", as.user_id).maybeSingle();
      setA({ ...as, profiles: prof });
    })();
  }, [id]);

  if (!a) return <div className="min-h-screen app-shell flex items-center justify-center">{t("loading")}</div>;
  const ev = a.ai_evaluation || {};

  return (
    <div className="min-h-screen app-shell">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}><ArrowLeft className="w-4 h-4 mr-2" />{t("nav.back")}</Button>
          <LanguageSwitcher />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="glass-card p-6 md:col-span-1">
            <h2 className="text-2xl font-bold">{a.profiles?.first_name} {a.profiles?.last_name}</h2>
            <p className="text-sm text-muted-foreground">{a.profiles?.email}</p>
            <p className="text-sm text-muted-foreground">{a.profiles?.phone}</p>
            <p className="text-xs text-muted-foreground mt-2">{t("admin.candidateId")} {a.profiles?.candidate_id || "—"}</p>

            <div className="my-6 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-secondary/50 text-center">
                <div className="text-3xl font-bold gradient-text">{a.fit_score ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{t("admin.fitS")}</div>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 text-center">
                <div className={`text-3xl font-bold ${a.trust_score >= 70 ? "text-success" : a.trust_score >= 40 ? "text-warning" : "text-destructive"}`}>{a.trust_score}</div>
                <div className="text-xs text-muted-foreground">{t("admin.trustS")}</div>
              </div>
            </div>

            <div className="text-sm space-y-1">
              <div><span className="text-muted-foreground">{t("admin.role")}</span> {a.job_role}</div>
              <div><span className="text-muted-foreground">{t("admin.exp")}</span> {a.experience}</div>
              <div><span className="text-muted-foreground">{t("admin.skills")}</span> {a.skills}</div>
              <div><span className="text-muted-foreground">{t("admin.confidence")}</span> {a.confidence}</div>
            </div>

            {a.flags?.length > 0 && (
              <div className="mt-5 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <div className="flex items-center gap-2 mb-2 text-destructive font-semibold text-sm"><ShieldAlert className="w-4 h-4" />{t("admin.flags")}</div>
                <div className="flex flex-wrap gap-1">
                  {a.flags.map((f: string, i: number) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-destructive/20 text-destructive">{f}</span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <div className="md:col-span-2 space-y-6">
            <Card className="glass-card p-6">
              <h3 className="font-bold mb-3">{t("admin.aiEval")}</h3>
              {ev.summary ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">{ev.summary}</p>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[[t("admin.communication"), ev.communication], [t("admin.confidenceLbl"), ev.confidence], [t("admin.domain"), ev.domain_knowledge]].map(([l, v]) => (
                      <div key={l as string} className="p-3 rounded-lg bg-secondary/40 text-center">
                        <div className="text-2xl font-bold">{v ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs uppercase text-primary mb-1">{t("admin.strengths")}</div>
                      <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">{ev.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                    </div>
                    <div>
                      <div className="text-xs uppercase text-accent mb-1">{t("admin.weaknesses")}</div>
                      <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">{ev.weaknesses?.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                    </div>
                  </div>
                </>
              ) : <p className="text-sm text-muted-foreground">{t("admin.noEval")}</p>}
            </Card>

            <Card className="glass-card p-6">
              <h3 className="font-bold mb-4">{t("admin.transcript")}</h3>
              <div className="space-y-4">
                {(a.transcript || []).map((tr: any, i: number) => (
                  <div key={i} className="border-l-2 border-primary/40 pl-4">
                    <div className="text-xs text-primary uppercase tracking-wider mb-1">Q{i + 1}</div>
                    <div className="font-medium mb-2">{tr.question}</div>
                    <div className="text-sm text-muted-foreground">{tr.answer}</div>
                  </div>
                ))}
                {(!a.transcript || a.transcript.length === 0) && <p className="text-sm text-muted-foreground">{t("admin.noTranscript")}</p>}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCandidate;
