import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

export const PreAssessmentDialog = ({ open, onOpenChange }: Props) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ job_role: "", experience: "", domains: "", skills: "", qualification: "", confidence: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) return;
    const langMap: Record<string, string> = { en: "English", hi: "Hindi", kn: "Kannada" };
    const { data, error } = await supabase.from("assessments").insert({
      user_id: s.session.user.id, ...form, language: langMap[i18n.language] || "English",
    }).select().single();
    setLoading(false);
    if (error) return toast.error(error.message);
    onOpenChange(false);
    navigate(`/interview/${data.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-lg">
        <DialogHeader><DialogTitle>{t("pre.title")}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>{t("pre.jobRole")}</Label><Input required value={form.job_role} onChange={(e) => setForm({ ...form, job_role: e.target.value })} placeholder={t("pre.jobRolePh")} /></div>
          <div><Label>{t("pre.exp")}</Label><Input required value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder={t("pre.expPh")} /></div>
          <div><Label>{t("pre.domains")}</Label><Input required value={form.domains} onChange={(e) => setForm({ ...form, domains: e.target.value })} placeholder={t("pre.domainsPh")} /></div>
          <div><Label>{t("pre.skills")}</Label><Input required value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder={t("pre.skillsPh")} /></div>
          <div><Label>{t("pre.qual")}</Label><Input required value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} placeholder={t("pre.qualPh")} /></div>
          <div>
            <Label>{t("pre.conf")}</Label>
            <Select value={form.confidence} onValueChange={(v) => setForm({ ...form, confidence: v })} required>
              <SelectTrigger><SelectValue placeholder={t("pre.confSelect")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">{t("pre.beginner")}</SelectItem>
                <SelectItem value="Intermediate">{t("pre.intermediate")}</SelectItem>
                <SelectItem value="Expert">{t("pre.expert")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? t("pre.starting") : t("pre.continue")}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
