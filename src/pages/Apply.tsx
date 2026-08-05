import { useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ShieldCheck,
  Code2,
  Video,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
} from "lucide-react";

type Team = "staff" | "development" | "contentcreator";

interface Question {
  id: string;
  label: string;
  help?: string;
  type: "short" | "long" | "radio";
  required?: boolean;
  options?: string[];
}

interface Section {
  title: string;
  description?: string;
  questions: Question[];
}

const STAFF_SECTIONS: Section[] = [
  {
    title: "Sollicitatie Hoofddorp Roleplay",
    description:
      "Leuk dat je een sollicitatie doet voor staff in HDRP! Controleer eerst of je aan de eisen voldoet.",
    questions: [
      { id: "name", label: "Wat is je naam?", type: "short", required: true },
      { id: "discord_name", label: "Discord user", type: "short", required: true },
      {
        id: "discord_id",
        label: "Discord ID",
        type: "short",
        required: true,
        help: "Zonder een geldig Discord ID is je sollicitatie niet geldig.",
      },
      { id: "roblox_name", label: "Roblox user", type: "short", required: true },
      { id: "age", label: "Wat is je leeftijd?", type: "short", required: true },
      { id: "voicechat", label: "Beschik je over ingame VC?", type: "radio", options: ["Ja", "Nee"], required: true },
      {
        id: "hours",
        label: "Hoeveel uren denk je per week online te kunnen zijn?",
        type: "radio",
        options: ["2 uur", "4 uur", "6 uur", "8 uur"],
        required: true,
      },
    ],
  },
  {
    title: "Over jou",
    questions: [
      {
        id: "about",
        label: "Vertel iets over jezelf.",
        help: "Geef een beknopt overzicht van je achtergrond en relevante ervaring. Focus op vaardigheden en eigenschappen die relevant zijn voor de functie.",
        type: "long",
        required: true,
      },
      { id: "weak", label: "Wat zijn je zwakke punten? (minstens 3)", type: "long", required: true },
      { id: "strong", label: "Wat zijn je sterke punten? (minstens 3)", type: "long", required: true },
      { id: "unique", label: "Wat onderscheidt jou van andere kandidaten?", type: "long", required: true },
      { id: "motivation", label: "Waarom ben je geïnteresseerd in deze functie?", type: "long", required: true },
      { id: "other_staff", label: "Ben je momenteel ergens anders staff?", type: "radio", options: ["Ja", "Nee"], required: true },
    ],
  },
  {
    title: "Kennisvragen",
    description: "Leg elk begrip uit in minimaal 15 woorden.",
    questions: [
      { id: "rdm", label: "Wat is RDM? (uitleg van 15+ woorden)", type: "long", required: true },
      { id: "frp", label: "Wat is FRP? (uitleg van 15+ woorden)", type: "long", required: true },
      { id: "nvol", label: "Wat is NVOL? (uitleg van 15+ woorden)", type: "long", required: true },
      { id: "nlr", label: "Wat is NLR? (uitleg van 15+ woorden)", type: "long", required: true },
      { id: "ta", label: "Wat is TA? (uitleg van 15+ woorden)", type: "long", required: true },
    ],
  },
  {
    title: "Afronding",
    questions: [
      {
        id: "extra",
        label: "Moeten wij nog iets van jou weten?",
        help: 'Als het antwoord nee is, vul dan "/" in.',
        type: "long",
        required: true,
      },
      { id: "questions", label: "Heb je nog vragen voor ons?", type: "long", required: true },
    ],
  },
];

const REQUIREMENTS = [
  "Je bent 15 jaar of ouder",
  "Goed werkende microfoon",
  "Veel actief",
  "Volwassen gedrag",
  "Geen ruzie maken of zoeken",
  "Beleefd zijn naar andere members",
  "Luisteren naar hogerop",
  "Je houdt je aan alle basisregels van HDRP",
];

const TEAMS: Array<{
  id: Team;
  label: string;
  description: string;
  icon: typeof ShieldCheck;
  open: boolean;
}> = [
  {
    id: "staff",
    label: "Staff team",
    description: "Handhaaf de regels, help spelers en houd HDRP eerlijk en gezellig.",
    icon: ShieldCheck,
    open: true,
  },
  {
    id: "development",
    label: "Development team",
    description: "Bouw en verbeter scripts, systemen en de website van HDRP.",
    icon: Code2,
    open: false,
  },
  {
    id: "contentcreator",
    label: "Content creator team",
    description: "Stream en maak video's over HDRP en groei mee met de community.",
    icon: Video,
    open: false,
  },
];

const Apply = () => {
  const [team, setTeam] = useState<Team | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const sections = STAFF_SECTIONS;
  const section = sections[step];
  const progress = useMemo(() => ((step + 1) / sections.length) * 100, [step, sections.length]);

  const setAnswer = (id: string, value: string) => setAnswers((prev) => ({ ...prev, [id]: value }));

  const validateSection = () => {
    const missing = section.questions.filter((q) => q.required && !answers[q.id]?.trim());
    if (missing.length) {
      toast({
        variant: "destructive",
        title: "Nog niet compleet",
        description: `Beantwoord eerst: ${missing[0].label}`,
      });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateSection()) return;
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!validateSection()) return;
    setSubmitting(true);

    try {
      const labelled: Record<string, string> = {};
      sections.forEach((s) =>
        s.questions.forEach((q) => {
          if (answers[q.id]) labelled[q.label] = answers[q.id];
        })
      );

      const payload = {
        team: "staff",
        name: answers.name.trim(),
        discord_name: answers.discord_name.trim(),
        discord_id: answers.discord_id?.trim() || null,
        roblox_name: answers.roblox_name.trim(),
        age: answers.age?.trim() || null,
        answers: labelled,
        status: "pending",
      };

      const { data: newId, error } = await (supabase.rpc as any)("submit_application", {
        _team: payload.team,
        _name: payload.name,
        _discord_name: payload.discord_name,
        _discord_id: payload.discord_id,
        _roblox_name: payload.roblox_name,
        _age: payload.age,
        _answers: labelled,
      });

      if (error) throw error;

      await supabase.functions.invoke("notify-application", {
        body: {
          event: "submitted",
          application_id: newId,
          team: payload.team,
          name: payload.name,
          discord_name: payload.discord_name,
          discord_id: payload.discord_id,
          roblox_name: payload.roblox_name,
          age: payload.age,
          answers: labelled,
        },
      });

      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Versturen mislukt",
        description: "Probeer het later opnieuw.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {!team && (
          <>
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Solliciteren
              </span>
              <h1 className="mt-5 font-heading text-3xl sm:text-4xl font-bold text-foreground">
                Word onderdeel van het HDRP-team
              </h1>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                Kies hieronder het team waarvoor je wilt solliciteren. Neem de tijd voor je antwoorden —
                een complete sollicitatie maakt echt verschil.
              </p>
            </div>

            <div className="mt-10 space-y-4">
              {TEAMS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  disabled={!t.open}
                  onClick={() => t.open && setTeam(t.id)}
                  className={`w-full text-left rounded-2xl border p-6 flex items-start gap-4 transition-colors ${
                    t.open
                      ? "border-border bg-card hover:border-primary/60 hover:bg-secondary/40"
                      : "border-border/60 bg-card/50 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                    <t.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-semibold text-foreground">{t.label}</h2>
                      {t.open ? (
                        <span className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                          Open
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          Binnenkort
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                  </div>
                  {t.open ? (
                    <ArrowRight className="h-5 w-5 text-muted-foreground mt-2" />
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground mt-2" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {team && done && (
          <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 text-center">
            <CheckCircle2 className="h-14 w-14 text-primary mx-auto" />
            <h1 className="mt-5 font-heading text-2xl sm:text-3xl font-bold text-foreground">
              Bedankt voor je sollicitatie!
            </h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
              Je sollicitatie is verstuurd naar het HDRP-team. Houd je Discord in de gaten — je krijgt
              daar bericht zodra je sollicitatie is behandeld.
            </p>
          </div>
        )}

        {team && !done && (
          <div>
            <button
              onClick={() => setTeam(null)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Ander team kiezen
            </button>

            {/* Voortgang */}
            <div className="mt-5 flex items-center gap-3">
              <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                Sectie {step + 1} van {sections.length}
              </span>
            </div>

            {/* Kop */}
            <div className="mt-5 rounded-2xl border border-border bg-card overflow-hidden">
              <div className="h-2 bg-primary" />
              <div className="p-6 sm:p-8">
                <h1 className="font-heading text-2xl font-bold text-foreground">{section.title}</h1>
                {section.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{section.description}</p>
                )}
                {step === 0 && (
                  <ul className="mt-5 space-y-1.5">
                    {REQUIREMENTS.map((req) => (
                      <li key={req} className="flex items-start gap-2 text-sm text-foreground/85">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Vragen */}
            <div className="mt-4 space-y-4">
              {section.questions.map((q) => (
                <div key={q.id} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                  <label className="block text-sm font-semibold text-foreground">
                    {q.label} {q.required && <span className="text-destructive">*</span>}
                  </label>
                  {q.help && <p className="mt-1 text-xs text-muted-foreground">{q.help}</p>}
                  {q.id === "discord_id" && (
                    <a
                      href="https://www.youtube.com/watch?v=cV_W-JPwSlM"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs font-medium text-primary underline underline-offset-2 hover:opacity-80"
                    >
                      Hoe vind ik mijn Discord ID?
                    </a>
                  )}

                  {q.type === "short" && (
                    <Input
                      className="mt-3"
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      placeholder="Kort antwoord"
                      maxLength={120}
                    />
                  )}

                  {q.type === "long" && (
                    <Textarea
                      className="mt-3 min-h-28"
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      placeholder="Lang antwoord"
                      maxLength={2000}
                    />
                  )}

                  {q.type === "radio" && (
                    <div className="mt-3 space-y-2">
                      {q.options?.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setAnswer(q.id, option)}
                          className={`w-full flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                            answers[q.id] === option
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border bg-background text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span
                            className={`h-4 w-4 rounded-full border-2 ${
                              answers[q.id] === option ? "border-primary bg-primary" : "border-muted-foreground/50"
                            }`}
                          />
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Navigatie */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                disabled={step === 0}
                onClick={() => {
                  setStep((s) => Math.max(0, s - 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Vorige
              </Button>

              {step < sections.length - 1 ? (
                <Button onClick={handleNext}>
                  Volgende
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Versturen..." : "Sollicitatie versturen"}
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Apply;
