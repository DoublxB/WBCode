import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, FileCode, ListChecks } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { ROADMAP_MODULES } from './roadmap/roadmapModules';
import { MODULE_MATERIALS } from '../../content/moduleMaterials';

function slugifyAnchor(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const ModuleMaterialsPage = () => {
  const navigate = useNavigate();
  const { moduleSlug } = useParams();

  const moduleInfo = useMemo(() => {
    const slug = String(moduleSlug || '').trim();
    return ROADMAP_MODULES.find((m) => m.slug === slug) || null;
  }, [moduleSlug]);

  const materials = useMemo(() => {
    const slug = String(moduleSlug || '').trim();
    return MODULE_MATERIALS[slug] || null;
  }, [moduleSlug]);

  if (!moduleInfo) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Modul invalid"
        description="Nu am găsit acest modul. Revino la Roadmap și încearcă din nou."
        actionLabel="Înapoi la Roadmap"
        onAction={() => navigate('/roadmap')}
      />
    );
  }

  const goToCodeLab = () => navigate(`/codelab?category=${encodeURIComponent(moduleInfo.slug)}`);

  return (
    <div className="relative flex flex-col gap-6 min-h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/roadmap')} className="px-3">
              <ArrowLeft className="h-4 w-4" />
              Roadmap
            </Button>
            <Badge variant="info">
              <BookOpen className="h-4 w-4" />
              Materiale
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={goToCodeLab}>
              <FileCode className="h-4 w-4" />
              Exersează (CodeLab)
            </Button>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold tracking-[0.22em] text-cyan-300/80">{moduleInfo.subtitle.toUpperCase()}</div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mt-1 text-balance">{moduleInfo.title}</h1>
          <p className="text-slate-300/90 mt-3 max-w-4xl leading-relaxed">{moduleInfo.description}</p>
        </div>
      </div>

      {!materials ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="font-bold text-white">Materiale în lucru</div>
              <Button variant="secondary" onClick={goToCodeLab}>
                <FileCode className="h-4 w-4" />
                Mergi la exerciții
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-slate-300 text-sm leading-relaxed">
              Conținutul pentru acest modul se generează/completează. Între timp, poți începe cu exercițiile din CodeLab și revii aici pentru teorie și exemple
              structurate.
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Quick navigation */}
          <Card className="border-slate-800/80">
            <CardHeader>
              <div className="flex items-center gap-2 font-bold text-white">
                <ListChecks className="h-4 w-4 text-cyan-300" />
                Hartă rapidă (secțiuni)
              </div>
              <div className="text-xs text-slate-400 mt-1">Tip: parcurge în ordine și după fiecare secțiune rezolvă 2–3 exerciții în CodeLab.</div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {materials.sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id || slugifyAnchor(s.title)}`}
                    className="px-3 py-2 rounded-xl border border-slate-800/80 bg-slate-950/30 hover:bg-slate-900/40 text-sm text-slate-200 transition-colors"
                  >
                    {s.title}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Prerequisites + objectives */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="font-bold text-white">Prerechizite</div>
                <div className="text-xs text-slate-400">Ce e bine să știi înainte.</div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-300">
                  {materials.prerequisites.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="font-bold text-white">Obiective</div>
                <div className="text-xs text-slate-400">Ce ar trebui să poți face după ce parcurgi materialul.</div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-300">
                  {materials.objectives.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            {materials.sections.map((section) => {
              const anchor = section.id || slugifyAnchor(section.title);
              return (
                <Card key={anchor} id={anchor} className="scroll-mt-28">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="font-bold text-white text-lg">{section.title}</div>
                        {section.whyItMatters && <div className="text-sm text-slate-400 mt-1">{section.whyItMatters}</div>}
                      </div>
                      <Button variant="ghost" onClick={goToCodeLab} className="px-3">
                        <FileCode className="h-4 w-4" />
                        Exersează
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {section.concepts.map((c, idx) => (
                        <div key={idx} className="space-y-3">
                          <div className="prose prose-invert max-w-none">
                            <p className="text-slate-200 leading-relaxed text-sm whitespace-pre-wrap">{c.explanation}</p>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            {c.examples.map((ex) => (
                              <div
                                key={ex.title}
                                className="rounded-2xl border border-slate-800/80 bg-slate-950/35 overflow-hidden"
                              >
                                <div className="px-4 py-3 border-b border-slate-800/70 flex items-center justify-between gap-3">
                                  <div className="text-sm font-semibold text-white">{ex.title}</div>
                                  <Badge variant="default">Exemplu</Badge>
                                </div>
                                <div className="p-4">
                                  <pre className="overflow-x-auto text-xs font-mono text-slate-100 leading-relaxed">
                                    <code>{ex.code}</code>
                                  </pre>
                                  {ex.note && <div className="text-xs text-slate-400 mt-3">{ex.note}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {(section.quickChecks?.length || section.commonMistakes?.length) && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {section.quickChecks?.length ? (
                            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/25 p-4">
                              <div className="text-sm font-semibold text-white mb-2">Auto-verificare (active recall)</div>
                              <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-300">
                                {section.quickChecks.map((q) => (
                                  <li key={q}>{q}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {section.commonMistakes?.length ? (
                            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/25 p-4">
                              <div className="text-sm font-semibold text-white mb-2">Capcane comune</div>
                              <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-300">
                                {section.commonMistakes.map((m) => (
                                  <li key={m}>{m}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Mastery checklist */}
          <Card className="border-emerald-500/25 bg-emerald-500/5">
            <CardHeader>
              <div className="font-bold text-white">Checklist de stăpânire</div>
              <div className="text-xs text-slate-300/80">Dacă bifezi aceste puncte, ești pregătit(ă) pentru orice problemă tipică din modul.</div>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-200">
                {materials.masteryChecklist.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ModuleMaterialsPage;


