import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Mic, Smartphone, Eye, AlertTriangle, Loader2, Mic as MicIcon, MicOff, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const TOTAL_Q = 5;

const Interview = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [stage, setStage] = useState<"instructions" | "interview" | "evaluating">("instructions");
  const [countdown, setCountdown] = useState(30);
  const [assessment, setAssessment] = useState<any>(null);
  const [trustScore, setTrustScore] = useState(100);
  const [history, setHistory] = useState<{ question: string; answer: string }[]>([]);
  const [currentQ, setCurrentQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [flags, setFlags] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const assessmentRef = useRef(assessment);
  useEffect(() => { assessmentRef.current = assessment; }, [assessment]);

  const langName = i18n.language === "hi" ? "Hindi" : i18n.language === "kn" ? "Kannada" : "English";

  const speakQuestion = (text?: string) => {
    const q = text ?? currentQ;
    if (!q || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(q);
      u.lang = i18n.language === "hi" ? "hi-IN" : i18n.language === "kn" ? "kn-IN" : "en-US";
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    } catch {}
  };

  // Auto-read each new question
  useEffect(() => {
    if (stage === "interview" && currentQ && !loading) speakQuestion(currentQ);
    // eslint-disable-next-line
  }, [currentQ, stage, loading]);

  // Multi-person detection using FaceDetector API (best-effort)
  useEffect(() => {
    if (stage !== "interview") return;
    const FD: any = (window as any).FaceDetector;
    if (!FD) return;
    let detector: any;
    try { detector = new FD({ fastMode: true, maxDetectedFaces: 5 }); } catch { return; }
    let lastAlert = 0;
    const iv = setInterval(async () => {
      const v = videoRef.current;
      if (!v || v.readyState < 2) return;
      try {
        const faces = await detector.detect(v);
        if (faces.length > 1 && Date.now() - lastAlert > 10000) {
          lastAlert = Date.now();
          addFlag("multiple_persons", -15, t("interview.multiplePersons", { defaultValue: "Multiple persons detected in frame!" }));
        }
      } catch {}
    }, 3000);
    return () => clearInterval(iv);
    // eslint-disable-next-line
  }, [stage]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("assessments").select("*").eq("id", id).maybeSingle();
      if (!data) return navigate("/dashboard");
      setAssessment(data);
    })();
  }, [id, navigate]);

  useEffect(() => {
    if (stage !== "instructions") return;
    const tm = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(tm);
  }, [stage]);

  useEffect(() => {
    if (stage !== "interview") return;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        document.documentElement.requestFullscreen?.().catch(() => {});
      } catch { toast.error(t("interview.camRequired")); }
    })();
    fetchNextQuestion([]);

    const onVis = () => { if (document.hidden) addFlag("tab_switch", -10, t("interview.tabSwitch")); };
    const onBlur = () => addFlag("window_blur", -5, t("interview.lostFocus"));
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    const eyeTimer = setInterval(() => {
      if (Math.random() < 0.08) addFlag("looked_away", -5, t("interview.lookedAway"));
    }, 8000);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      clearInterval(eyeTimer);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      document.exitFullscreen?.().catch(() => {});
    };
    // eslint-disable-next-line
  }, [stage]);

  const addFlag = (type: string, delta: number, message: string) => {
    setTrustScore((s) => Math.max(0, s + delta));
    setFlags((f) => [...f, type]);
    toast.warning(message);
  };

  const fetchNextQuestion = async (hist: any[]) => {
    setLoading(true); setAnswer("");
    try {
      const { data, error } = await supabase.functions.invoke("interview-ai", {
        body: { action: "next_question", preAssessment: assessmentRef.current || assessment, history: hist, language: langName },
      });
      if (error) throw error;
      setCurrentQ(data.question);
    } catch { toast.error(t("interview.failedQ")); }
    setLoading(false);
  };

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return toast.error("Voice input not supported");
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true;
    rec.lang = i18n.language === "hi" ? "hi-IN" : i18n.language === "kn" ? "kn-IN" : "en-US";
    rec.onresult = (e: any) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setAnswer(text);
    };
    rec.onerror = () => setRecording(false);
    rec.start();
    recognitionRef.current = rec;
    setRecording(true);
  };
  const stopVoice = () => { recognitionRef.current?.stop(); setRecording(false); };

  const submitAnswer = async () => {
    if (!answer.trim()) return toast.error(t("interview.answerFirst"));
    const newHist = [...history, { question: currentQ, answer }];
    setHistory(newHist);
    if (newHist.length >= TOTAL_Q) finish(newHist);
    else fetchNextQuestion(newHist);
  };

  const finish = async (transcript: any[]) => {
    setStage("evaluating"); stopVoice();
    try {
      const { data, error } = await supabase.functions.invoke("interview-ai", {
        body: { action: "evaluate", preAssessment: assessment, transcript, trustScore, language: langName },
      });
      if (error) throw error;
      await supabase.from("assessments").update({
        transcript, trust_score: trustScore, fit_score: data.fit_score,
        status: data.status, ai_feedback: data.candidate_feedback,
        ai_evaluation: data.admin_evaluation, flags: [...flags, ...(data.flags || [])],
        completed_at: new Date().toISOString(),
      }).eq("id", id);
      navigate(`/result/${id}`);
    } catch (e: any) {
      toast.error("Evaluation failed: " + e.message);
      setStage("interview");
    }
  };

  if (stage === "instructions") {
    return (
      <div className="min-h-screen app-shell flex items-center justify-center px-6 py-12">
        <Card className="glass-card p-8 max-w-2xl w-full animate-fade-up">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">{t("interview.before")}</h1>
            <LanguageSwitcher />
          </div>
          <p className="text-muted-foreground mb-6">{t("interview.beforeDesc")}</p>
          <div className="grid gap-4 mb-8">
            {[
              { icon: Camera, text: t("interview.r1") },
              { icon: Mic, text: t("interview.r2") },
              { icon: Eye, text: t("interview.r3") },
              { icon: Smartphone, text: t("interview.r4") },
              { icon: AlertTriangle, text: t("interview.r5") },
            ].map((r, i) => (
              <div key={i} className="flex items-start gap-3">
                <r.icon className="w-5 h-5 text-primary mt-0.5" />
                <span>{r.text}</span>
              </div>
            ))}
          </div>
          <Button size="lg" className="w-full bg-gradient-to-r from-secondary via-accent to-primary text-primary-foreground" disabled={countdown > 0} onClick={async () => {
            try { await document.documentElement.requestFullscreen(); } catch {}
            setStage("interview");
          }}>
            {countdown > 0 ? t("interview.readCarefully", { n: countdown }) : t("interview.understand")}
          </Button>
        </Card>
      </div>
    );
  }

  if (stage === "evaluating") {
    return (
      <div className="min-h-screen app-shell flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-lg">{t("interview.evaluating")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-shell flex flex-col">
      <div className="px-6 py-3 border-b border-border flex items-center justify-between glass-card rounded-none">
        <div className="text-sm">{t("interview.question")} <b>{history.length + 1}</b> {t("interview.of")} {TOTAL_Q}</div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{t("interview.trust")}</span>
          <span className={`font-bold ${trustScore >= 70 ? "text-success" : trustScore >= 40 ? "text-warning" : "text-destructive"}`}>{trustScore}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 p-6">
        <div className="flex-1 flex flex-col">
          <Card className="glass-card p-8 flex-1 flex flex-col justify-center">
            {loading ? (
              <div className="text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-primary uppercase tracking-wider">{t("interview.interviewer")}</div>
                  <Button variant="outline" size="sm" onClick={() => speakQuestion()}>
                    <Volume2 className="w-4 h-4 mr-2" />{t("interview.readAgain", { defaultValue: "Read again" })}
                  </Button>
                </div>
                <h2 className="text-2xl md:text-3xl font-semibold leading-relaxed">{currentQ}</h2>
              </>
            )}
          </Card>

          <Card className="glass-card p-4 mt-4">
            <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={t("interview.typeAnswer")} className="w-full bg-transparent resize-none outline-none min-h-[100px]" />
            <div className="flex items-center justify-between mt-2">
              <Button variant="outline" size="sm" onClick={recording ? stopVoice : startVoice}>
                {recording ? <><MicOff className="w-4 h-4 mr-2" />{t("interview.stop")}</> : <><MicIcon className="w-4 h-4 mr-2" />{t("interview.speak")}</>}
              </Button>
              <Button onClick={submitAnswer} disabled={loading || !answer.trim()}>
                {history.length + 1 === TOTAL_Q ? t("interview.finish") : t("interview.next")}
              </Button>
            </div>
          </Card>
        </div>

        <div className="md:w-72">
          <Card className="glass-card p-3">
            <video ref={videoRef} autoPlay muted playsInline className="w-full rounded-lg bg-black aspect-video object-cover" />
            <div className="text-xs text-center text-muted-foreground mt-2">{t("interview.live")}</div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Interview;
