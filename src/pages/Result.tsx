import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles, ArrowRight } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Result = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [a, setA] = useState<any>(null);

  useEffect(() => {
    supabase.from("assessments").select("*").eq("id", id).maybeSingle().then(({ data }) => setA(data));
  }, [id]);

  if (!a) return <div className="min-h-screen app-shell flex items-center justify-center">{t("loading")}</div>;
  const score = a.fit_score ?? 0;
  const tone = score >= 75 ? t("result.great") : score >= 50 ? t("result.good") : t("result.nice");

  return (
    <div className="min-h-screen app-shell flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl">
        <div className="flex justify-end mb-3"><LanguageSwitcher /></div>
        <Card className="glass-card p-10 text-center animate-fade-up">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-secondary via-accent to-primary flex items-center justify-center mb-6 glow animate-float">
            <Trophy className="w-10 h-10 text-primary-foreground" />
          </div>
          <p className="text-sm text-primary uppercase tracking-wider mb-2">{t("result.title")}</p>
          <h1 className="text-2xl font-bold mb-1">{tone}</h1>
          <div className="text-7xl font-bold gradient-text my-6">{score}</div>
          <p className="text-muted-foreground">{t("result.fitScore")}</p>
          <div className="my-6 p-5 rounded-xl bg-secondary/40 text-left">
            <div className="flex items-start gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary mt-1" />
              <span className="font-semibold">{t("result.feedback")}</span>
            </div>
            <p className="text-sm text-muted-foreground">{a.ai_feedback || t("result.fallback")}</p>
          </div>
          <Button className="w-full" onClick={() => navigate("/dashboard")}>{t("result.back")} <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </Card>
      </div>
    </div>
  );
};

export default Result;
