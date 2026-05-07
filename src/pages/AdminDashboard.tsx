import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, LogOut, Users, CheckCircle2, AlertTriangle, ShieldAlert, Download, Eye } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const STATUS_COLOR: Record<string, string> = {
  job_fit: "bg-success/20 text-success",
  training_needed: "bg-warning/20 text-warning",
  manual_review: "bg-primary/20 text-primary",
  low_confidence: "bg-muted text-muted-foreground",
  fraud_suspected: "bg-destructive/20 text-destructive",
  in_progress: "bg-secondary text-muted-foreground",
};

const AdminDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [lang, setLang] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) return navigate("/auth?role=admin");
      const { data: assessments, error } = await supabase.from("assessments").select("*").order("created_at", { ascending: false });
      if (error) { console.error("assessments error", error); setRows([]); return; }
      const userIds = Array.from(new Set((assessments || []).map((a: any) => a.user_id)));
      const { data: profs } = userIds.length
        ? await supabase.from("profiles").select("id, first_name, last_name, email, candidate_id, phone").in("id", userIds)
        : { data: [] as any[] };
      const map = new Map((profs || []).map((p: any) => [p.id, p]));
      setRows((assessments || []).map((a: any) => ({ ...a, profiles: map.get(a.user_id) || null })));
    })();
  }, [navigate]);

  const filtered = useMemo(() => rows.filter((r) => {
    const name = `${r.profiles?.first_name || ""} ${r.profiles?.last_name || ""} ${r.profiles?.email || ""}`.toLowerCase();
    if (search && !name.includes(search.toLowerCase())) return false;
    if (lang !== "all" && r.language !== lang) return false;
    if (status !== "all" && r.status !== status) return false;
    return true;
  }), [rows, search, lang, status]);

  const stats = {
    total: rows.length,
    ready: rows.filter((r) => r.status === "job_fit").length,
    review: rows.filter((r) => r.status === "manual_review").length,
    fraud: rows.filter((r) => r.status === "fraud_suspected").length,
  };

  const exportCsv = (data: any[]) => {
    const header = [t("admin.name"), t("auth.email"), t("admin.language"), t("admin.status"), t("admin.score"), t("admin.date")];
    const lines = [header.join(",")].concat(
      data.map((r) => [
        `${r.profiles?.first_name || ""} ${r.profiles?.last_name || ""}`,
        r.profiles?.email || "", r.language || "",
        t(`status.${r.status}`), r.fit_score ?? "",
        new Date(r.created_at).toLocaleDateString(),
      ].map((v) => `"${v}"`).join(","))
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "candidates.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const logout = async () => { await supabase.auth.signOut(); navigate("/"); };

  const STATUS_KEYS = ["job_fit","training_needed","manual_review","low_confidence","fraud_suspected","in_progress"];

  return (
    <div className="min-h-screen app-shell">
      <nav className="container mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary via-accent/80 to-primary flex items-center justify-center glow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">{t("adminBrand")}</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" onClick={logout}><LogOut className="w-4 h-4 mr-2" />{t("nav.logout")}</Button>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8 space-y-8">
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { icon: Users, label: t("admin.total"), value: stats.total, color: "text-primary" },
            { icon: CheckCircle2, label: t("admin.ready"), value: stats.ready, color: "text-success" },
            { icon: AlertTriangle, label: t("admin.review"), value: stats.review, color: "text-warning" },
            { icon: ShieldAlert, label: t("admin.fraud"), value: stats.fraud, color: "text-destructive" },
          ].map((s, i) => (
            <Card key={i} className="glass-card p-5">
              <s.icon className={`w-7 h-7 ${s.color} mb-3`} />
              <div className="text-3xl font-bold">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </Card>
          ))}
        </div>

        <Card className="glass-card p-5">
          <div className="flex flex-col md:flex-row gap-3 mb-5">
            <Input placeholder={t("admin.searchPh")} value={search} onChange={(e) => setSearch(e.target.value)} className="md:max-w-xs" />
            <Select value={lang} onValueChange={setLang}>
              <SelectTrigger className="md:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.allLang")}</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Hindi">हिन्दी</SelectItem>
                <SelectItem value="Kannada">ಕನ್ನಡ</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.allStatus")}</SelectItem>
                {STATUS_KEYS.map((k) => <SelectItem key={k} value={k}>{t(`status.${k}`)}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="md:ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => exportCsv(filtered)}><Download className="w-4 h-4 mr-2" />{t("admin.exportFiltered")}</Button>
              <Button variant="outline" size="sm" onClick={() => exportCsv(rows.filter((r) => r.status === "job_fit"))}><Download className="w-4 h-4 mr-2" />{t("admin.jobReadyList")}</Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3">{t("admin.name")}</th>
                  <th>{t("admin.language")}</th>
                  <th>{t("admin.status")}</th>
                  <th>{t("admin.score")}</th>
                  <th>{t("admin.date")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="py-3">
                      <div className="font-medium">{r.profiles?.first_name} {r.profiles?.last_name}</div>
                      <div className="text-xs text-muted-foreground">{r.profiles?.email}</div>
                    </td>
                    <td>{r.language}</td>
                    <td><span className={`px-2 py-1 rounded text-xs ${STATUS_COLOR[r.status] || ""}`}>{t(`status.${r.status}`)}</span></td>
                    <td className="font-bold">{r.fit_score ?? "—"}</td>
                    <td className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/candidate/${r.id}`)}><Eye className="w-4 h-4 mr-1" />{t("admin.view")}</Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">{t("admin.noCandidates")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
