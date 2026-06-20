import { useState, useEffect, useRef } from "react";

// ─── Design tokens ─────────────────────────────────────────────────
const C = {
  coral:   "#FF6B6B",
  amber:   "#FF8E53",
  bg:      "#FFF8F6",
  white:   "#FFFFFF",
  surface: "#FFF1EE",
  border:  "#FFD6CC",
  ink:     "#1A1A2A",
  muted:   "#8A7F7C",
  muted2:  "#C4B5B2",
  success: "#4CAF82",
};
const GRAD = `linear-gradient(135deg, ${C.coral}, ${C.amber})`;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:${C.bg};font-family:'DM Sans',sans-serif;color:${C.ink};}
textarea,input{font-family:'DM Sans',sans-serif;}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes blink{0%,100%{opacity:0}50%{opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
`;

// ─── Storage helpers ────────────────────────────────────────────────
const STORAGE_KEY = "mirro_data";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { users: {}, currentUser: null };
  } catch { return { users: {}, currentUser: null }; }
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Tiny components ────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{
      width: 28, height: 28,
      border: `3px solid ${C.border}`,
      borderTopColor: C.coral,
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    }} />
  );
}

function Logo({ size = 20 }) {
  return (
    <span style={{
      fontFamily: "'Fraunces', serif", fontWeight: 600,
      fontSize: size, color: C.ink, letterSpacing: "-0.5px",
    }}>
      mirro<span style={{ color: C.coral }}>.</span>
    </span>
  );
}

function Btn({ children, onClick, disabled, variant = "primary", style: s = {} }) {
  const base = {
    border: "none", borderRadius: 12, padding: "13px 24px",
    fontSize: 14, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.18s", fontFamily: "'DM Sans', sans-serif",
    display: "flex", alignItems: "center",
    justifyContent: "center", gap: 8, ...s,
  };
  if (variant === "ghost") return (
    <button onClick={onClick} disabled={disabled} style={{
      ...base, background: "transparent",
      color: C.muted, border: `1.5px solid ${C.border}`,
    }}>{children}</button>
  );
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...base,
      background: disabled ? C.muted2 : GRAD,
      color: "#fff",
      boxShadow: disabled ? "none" : `0 4px 16px ${C.coral}44`,
    }}>{children}</button>
  );
}

function FieldInput({ value, onChange, placeholder, type = "text" }) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      type={type} value={value}
      onChange={onChange} placeholder={placeholder}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        width: "100%", padding: "12px 16px",
        background: C.white,
        border: `1.5px solid ${focus ? C.coral : C.border}`,
        borderRadius: 12, fontSize: 14, color: C.ink,
        outline: "none", transition: "border 0.2s",
      }}
    />
  );
}

// ─── Typewriter ──────────────────────────────────────────────────────
function Typewriter({ text, speed = 25, onDone }) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  const idx = useRef(0);

  useEffect(() => {
    setShown(""); setDone(false); idx.current = 0;
    const t = setInterval(() => {
      if (idx.current < text.length) {
        setShown(text.slice(0, ++idx.current));
      } else {
        clearInterval(t); setDone(true); onDone?.();
      }
    }, speed);
    return () => clearInterval(t);
  }, [text]);

  return (
    <span>
      {shown}
      {!done && (
        <span style={{
          display: "inline-block", width: 2, height: "0.9em",
          background: C.coral, marginLeft: 2,
          verticalAlign: "text-bottom",
          animation: "blink 0.9s step-end infinite",
        }} />
      )}
    </span>
  );
}

// ─── Auth screen ─────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = () => {
    setErr(""); setLoading(true);
    setTimeout(() => {
      const data = loadData();
      if (mode === "register") {
        if (data.users[email]) { setErr("E-mail já cadastrado."); setLoading(false); return; }
        if (pass.length < 6) { setErr("Senha deve ter ao menos 6 caracteres."); setLoading(false); return; }
        data.users[email] = { email, pass, reflections: [] };
      } else {
        if (!data.users[email] || data.users[email].pass !== pass) {
          setErr("E-mail ou senha incorretos."); setLoading(false); return;
        }
      }
      data.currentUser = email;
      saveData(data);
      onAuth(email);
      setLoading(false);
    }, 600);
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", alignItems: "center",
      justifyContent: "center", padding: 24,
    }}>
      <div style={{
        width: "100%", maxWidth: 400,
        background: C.white, borderRadius: 24,
        border: `1px solid ${C.border}`,
        padding: 36,
        boxShadow: `0 8px 40px ${C.coral}11`,
        animation: "fadeUp 0.5s ease",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: GRAD, fontSize: 24,
            display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 16px",
          }}>🪞</div>
          <Logo size={28} />
          <div style={{ marginTop: 8, fontSize: 13, color: C.muted }}>
            {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta gratuita"}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <FieldInput value={email} onChange={e => setEmail(e.target.value)} placeholder="Seu e-mail" type="email" />
          <FieldInput value={pass} onChange={e => setPass(e.target.value)} placeholder="Senha" type="password" />
          {err && (
            <div style={{
              fontSize: 12, color: "#E53935",
              background: "#FFEBEE", borderRadius: 8, padding: "8px 12px",
            }}>{err}</div>
          )}
          <Btn onClick={handle} disabled={!email || !pass || loading} style={{ width: "100%", marginTop: 4 }}>
            {loading ? <Spinner /> : mode === "login" ? "Entrar" : "Criar conta"}
          </Btn>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: C.muted }}>
          {mode === "login" ? "Não tem conta? " : "Já tem conta? "}
          <span
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}
            style={{ color: C.coral, cursor: "pointer", fontWeight: 500 }}
          >
            {mode === "login" ? "Criar agora" : "Entrar"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Questions ───────────────────────────────────────────────────────
const QUESTIONS = [
  "O que aconteceu hoje que ficou na sua cabeça?",
  "Como você reagiu a isso?",
  "O que estava sentindo naquele momento?",
];

// ─── Reflect screen ──────────────────────────────────────────────────
function ReflectScreen({ userEmail, onDone }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(["", "", ""]);
  const [current, setCurrent] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const taRef = useRef(null);

  useEffect(() => { setReady(false); setCurrent(""); }, [step]);
  useEffect(() => { if (ready) taRef.current?.focus(); }, [ready]);

  const next = async () => {
    const a = [...answers]; a[step] = current; setAnswers(a);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setSaving(true);
      let insight = "", pattern = "", question = "";
      try {
        const prompt = `O usuário respondeu 3 perguntas de reflexão diária:
1. O que aconteceu hoje: "${a[0]}"
2. Como reagiu: "${a[1]}"
3. O que sentia: "${a[2]}"

Responda APENAS com JSON sem markdown:
{"insight":"frase direta e honesta sobre o padrão emocional de hoje (máx 2 frases)","pattern":"um comportamento ou padrão identificado (máx 1 frase)","question":"uma pergunta provocadora para a pessoa refletir (máx 1 frase)"}`;

        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-6", max_tokens: 1000,
            messages: [{ role: "user", content: prompt }],
          }),
        });
        const d = await r.json();
        const txt = d.content?.[0]?.text?.replace(/```json|```/g, "").trim() || "{}";
        const parsed = JSON.parse(txt);
        insight = parsed.insight || "";
        pattern = parsed.pattern || "";
        question = parsed.question || "";
      } catch { insight = "Reflexão salva com sucesso."; }

      // Save to localStorage
      const data = loadData();
      const entry = {
        date: todayKey(),
        timestamp: Date.now(),
        q1: a[0], q2: a[1], q3: a[2],
        insight, pattern, question,
      };
      if (!data.users[userEmail].reflections) data.users[userEmail].reflections = [];
      // Remove existing today entry if any
      data.users[userEmail].reflections = data.users[userEmail].reflections.filter(r => r.date !== todayKey());
      data.users[userEmail].reflections.unshift(entry);
      saveData(data);

      onDone({ answers: a, insight, pattern, question });
      setSaving(false);
    }
  };

  const pct = (step / QUESTIONS.length) * 100;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ height: 3, background: C.border }}>
        <div style={{ height: "100%", width: `${pct}%`, background: GRAD, transition: "width 0.4s ease" }} />
      </div>
      <div style={{
        padding: "16px 24px", background: C.white,
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Logo />
        <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{step + 1} / {QUESTIONS.length}</span>
      </div>

      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "32px 24px 48px",
        maxWidth: 520, margin: "0 auto", width: "100%",
      }}>
        {saving ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <Spinner />
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, color: C.muted, fontStyle: "italic" }}>
              O espelho está te observando...
            </div>
          </div>
        ) : (
          <div style={{ width: "100%", animation: "fadeUp 0.4s ease" }}>
            <div style={{
              fontSize: 11, color: C.coral, fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 18,
            }}>Pergunta {step + 1}</div>
            <div style={{
              fontFamily: "'Fraunces', serif", fontSize: 24,
              color: C.ink, lineHeight: 1.55, marginBottom: 28, minHeight: 72,
            }}>
              <Typewriter text={QUESTIONS[step]} onDone={() => setReady(true)} />
            </div>
            {ready && (
              <div style={{ animation: "fadeUp 0.3s ease" }}>
                <textarea
                  ref={taRef}
                  value={current}
                  onChange={e => setCurrent(e.target.value)}
                  placeholder="Escreva sem filtro..."
                  rows={5}
                  style={{
                    width: "100%", background: C.white,
                    border: `1.5px solid ${current ? C.coral + "66" : C.border}`,
                    borderRadius: 14, padding: "14px 16px",
                    fontSize: 15, color: C.ink, lineHeight: 1.7,
                    outline: "none", resize: "none", transition: "border 0.2s",
                  }}
                />
                <Btn onClick={next} disabled={!current.trim()} style={{ width: "100%", marginTop: 12 }}>
                  {step < QUESTIONS.length - 1 ? "Próxima →" : "Ver o que o espelho vê"}
                </Btn>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Insight screen ──────────────────────────────────────────────────
function InsightScreen({ data, onBack }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <div style={{
        padding: "16px 24px", background: C.white,
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Logo />
        <span style={{ fontSize: 12, color: C.success, fontWeight: 600 }}>✓ Salvo</span>
      </div>

      <div style={{
        flex: 1, padding: "32px 24px 48px",
        maxWidth: 520, margin: "0 auto", width: "100%",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        <div style={{ animation: "fadeUp 0.4s ease" }}>
          <div style={{
            fontSize: 11, color: C.coral, fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 14,
          }}>O que o espelho vê hoje</div>
          <div style={{
            background: C.white, borderRadius: 18,
            border: `1.5px solid ${C.coral}33`,
            padding: "24px 22px",
            boxShadow: `0 4px 24px ${C.coral}11`,
          }}>
            <div style={{
              fontFamily: "'Fraunces', serif", fontSize: 19,
              color: C.ink, lineHeight: 1.65, fontStyle: "italic",
            }}>"{data.insight}"</div>
          </div>
        </div>

        {data.pattern && (
          <div style={{
            background: C.white, borderRadius: 14,
            border: `1px solid ${C.border}`, padding: "18px 20px",
            animation: "fadeUp 0.4s ease 0.1s both",
          }}>
            <div style={{ fontSize: 11, color: C.coral, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Padrão identificado</div>
            <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.6 }}>{data.pattern}</div>
          </div>
        )}

        {data.question && (
          <div style={{
            background: C.surface, borderRadius: 14,
            border: `1px solid ${C.border}`, padding: "18px 20px",
            animation: "fadeUp 0.4s ease 0.2s both",
          }}>
            <div style={{ fontSize: 11, color: C.amber, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Para refletir</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, color: C.ink, lineHeight: 1.6, fontStyle: "italic" }}>"{data.question}"</div>
          </div>
        )}

        <Btn onClick={onBack} variant="ghost" style={{ width: "100%", marginTop: 8 }}>
          Ir para o início
        </Btn>
      </div>
    </div>
  );
}

// ─── History screen ──────────────────────────────────────────────────
function HistoryScreen({ userEmail }) {
  const [entries, setEntries] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const data = loadData();
    setEntries(data.users[userEmail]?.reflections || []);
  }, [userEmail]);

  if (!entries.length) return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🪞</div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, color: C.muted }}>Nenhuma reflexão ainda.</div>
      <div style={{ fontSize: 13, color: C.muted2, marginTop: 6 }}>Complete sua primeira reflexão para ver o histórico aqui.</div>
    </div>
  );

  return (
    <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
      {entries.map((e, i) => (
        <div
          key={i}
          onClick={() => setExpanded(expanded === i ? null : i)}
          style={{
            background: C.white, borderRadius: 14,
            border: `1px solid ${expanded === i ? C.coral + "44" : C.border}`,
            padding: "16px 18px", cursor: "pointer",
            transition: "border 0.2s",
            animation: `fadeUp 0.4s ease ${i * 0.05}s both`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{e.date}</div>
            <div style={{ fontSize: 18, color: C.muted2, transition: "transform 0.2s", transform: expanded === i ? "rotate(90deg)" : "none" }}>›</div>
          </div>
          <div style={{
            fontSize: 13, color: C.muted, marginTop: 6,
            fontStyle: "italic", fontFamily: "'Fraunces', serif", lineHeight: 1.5,
            ...(expanded === i ? {} : { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }),
          }}>"{e.insight}"</div>

          {expanded === i && (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {[["O que aconteceu", e.q1], ["Como reagiu", e.q2], ["O que sentia", e.q3]].map(([label, val]) => val && (
                <div key={label}>
                  <div style={{ fontSize: 10, color: C.coral, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.55 }}>{val}</div>
                </div>
              ))}
              {e.pattern && (
                <div style={{ background: C.surface, borderRadius: 10, padding: "10px 14px", marginTop: 4 }}>
                  <div style={{ fontSize: 10, color: C.amber, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 3 }}>Padrão</div>
                  <div style={{ fontSize: 13, color: C.ink }}>{e.pattern}</div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Weekly screen ───────────────────────────────────────────────────
function WeeklyScreen({ userEmail }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    const data = loadData();
    const all = data.users[userEmail]?.reflections || [];
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    setEntries(all.filter(e => e.timestamp >= cutoff));
  }, [userEmail]);

  const generate = async () => {
    setLoading(true);
    try {
      const summary = entries.map((e, i) =>
        `Dia ${i + 1} (${e.date}): aconteceu "${e.q1}", reagiu "${e.q2}", sentia "${e.q3}". Insight: ${e.insight}`
      ).join("\n");

      const prompt = `Baseado nas reflexões da semana:\n${summary}\n\nGere relatório semanal em JSON sem markdown:\n{"title":"título poderoso","overview":"2 frases resumindo a semana emocionalmente","patterns":["padrão 1","padrão 2","padrão 3"],"highlight":"momento mais significativo","challenge":"maior desafio identificado","growth":"sinal de crescimento mais claro","next_week":"intenção concreta para a próxima semana"}`;

      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const d = await r.json();
      const txt = d.content?.[0]?.text?.replace(/```json|```/g, "").trim() || "{}";
      setReport(JSON.parse(txt));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div style={{ padding: "24px 16px", maxWidth: 520, margin: "0 auto" }}>
      {!report ? (
        <div style={{ animation: "fadeUp 0.4s ease" }}>
          <div style={{
            background: C.white, borderRadius: 18,
            border: `1px solid ${C.border}`, padding: "28px 20px", textAlign: "center",
          }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>📊</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, color: C.ink, marginBottom: 8 }}>Relatório semanal</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 24 }}>
              {entries.length === 0
                ? "Você ainda não tem reflexões essa semana."
                : `${entries.length} reflexão${entries.length > 1 ? "ões" : ""} essa semana. Pronto para ver os padrões?`}
            </div>
            <Btn onClick={generate} disabled={entries.length === 0 || loading} style={{ width: "100%" }}>
              {loading ? <Spinner /> : "Gerar relatório"}
            </Btn>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeUp 0.4s ease" }}>
          <div style={{ background: GRAD, borderRadius: 18, padding: "24px 20px", color: "#fff" }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1.5px", opacity: 0.8, marginBottom: 10 }}>Sua semana</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, lineHeight: 1.5, marginBottom: 10 }}>{report.title}</div>
            <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.6 }}>{report.overview}</div>
          </div>

          {report.patterns?.length > 0 && (
            <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "16px 18px" }}>
              <div style={{ fontSize: 10, color: C.coral, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>Padrões da semana</div>
              {report.patterns.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span style={{ color: C.coral, fontWeight: 700 }}>·</span>
                  <span style={{ fontSize: 13, color: C.ink, lineHeight: 1.55 }}>{p}</span>
                </div>
              ))}
            </div>
          )}

          {[
            { label: "Momento mais significativo", value: report.highlight, color: C.coral },
            { label: "Maior desafio", value: report.challenge, color: C.amber },
            { label: "Sinal de crescimento", value: report.growth, color: C.success },
          ].map(({ label, value, color }) => value && (
            <div key={label} style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: "16px 18px" }}>
              <div style={{ fontSize: 10, color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.6 }}>{value}</div>
            </div>
          ))}

          {report.next_week && (
            <div style={{ background: C.surface, borderRadius: 14, border: `1.5px solid ${C.coral}33`, padding: "18px 20px" }}>
              <div style={{ fontSize: 10, color: C.coral, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Intenção para a próxima semana</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, color: C.ink, lineHeight: 1.6, fontStyle: "italic" }}>"{report.next_week}"</div>
            </div>
          )}

          <Btn onClick={() => setReport(null)} variant="ghost" style={{ width: "100%", marginTop: 4 }}>Voltar</Btn>
        </div>
      )}
    </div>
  );
}

// ─── Home screen ─────────────────────────────────────────────────────
function HomeScreen({ userEmail, onReflect }) {
  const data = loadData();
  const reflections = data.users[userEmail]?.reflections || [];
  const todayEntry = reflections.find(r => r.date === todayKey());
  const streak = (() => {
    let s = 0;
    const check = new Date();
    for (let i = 0; i < 30; i++) {
      const key = check.toISOString().slice(0, 10);
      if (reflections.find(r => r.date === key)) { s++; check.setDate(check.getDate() - 1); }
      else break;
    }
    return s;
  })();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const name = userEmail.split("@")[0];

  return (
    <div style={{ padding: "28px 16px", maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ animation: "fadeUp 0.4s ease" }}>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>{greeting},</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, color: C.ink }}>
          {name}<span style={{ color: C.coral }}>.</span>
        </div>
      </div>

      {streak > 0 && (
        <div style={{
          background: GRAD, borderRadius: 16,
          padding: "16px 20px", display: "flex", alignItems: "center", gap: 14,
          animation: "fadeUp 0.4s ease 0.05s both",
        }}>
          <div style={{ fontSize: 32 }}>🔥</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: "'Fraunces', serif" }}>{streak} dia{streak > 1 ? "s" : ""}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>de sequência — continue assim</div>
          </div>
        </div>
      )}

      <div style={{
        background: C.white, borderRadius: 18,
        border: `1.5px solid ${todayEntry ? C.coral + "33" : C.border}`,
        padding: "24px 20px",
        animation: "fadeUp 0.4s ease 0.1s both",
      }}>
        {todayEntry ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>✅</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.success }}>Reflexão de hoje completa</span>
            </div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, color: C.ink, lineHeight: 1.65, fontStyle: "italic" }}>
              "{todayEntry.insight}"
            </div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, color: C.ink, marginBottom: 8, lineHeight: 1.4 }}>
              O espelho está esperando por você.
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
              2 minutos. 3 perguntas. Um insight que você não esperava.
            </div>
            <Btn onClick={onReflect} style={{ width: "100%" }}>Começar reflexão de hoje</Btn>
          </>
        )}
      </div>

      <div style={{
        background: C.surface, borderRadius: 14,
        border: `1px solid ${C.border}`, padding: "18px 20px",
        animation: "fadeUp 0.4s ease 0.15s both",
      }}>
        <div style={{ fontSize: 10, color: C.amber, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Para refletir</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, color: C.ink, lineHeight: 1.65, fontStyle: "italic" }}>
          "Conhecer os outros é sabedoria. Conhecer a si mesmo é iluminação."
        </div>
        <div style={{ fontSize: 11, color: C.muted2, marginTop: 6 }}>— Lao Tsé</div>
      </div>
    </div>
  );
}

// ─── Main app ────────────────────────────────────────────────────────
export default function MirroPlatform() {
  const [userEmail, setUserEmail] = useState(null);
  const [tab, setTab] = useState("home");
  const [reflecting, setReflecting] = useState(false);
  const [insightData, setInsightData] = useState(null);

  useEffect(() => {
    const data = loadData();
    if (data.currentUser && data.users[data.currentUser]) {
      setUserEmail(data.currentUser);
    }
  }, []);

  const logout = () => {
    const data = loadData();
    data.currentUser = null;
    saveData(data);
    setUserEmail(null);
    setTab("home");
  };

  if (!userEmail) return (
    <><style>{CSS}</style><AuthScreen onAuth={setUserEmail} /></>
  );

  if (reflecting) return (
    <><style>{CSS}</style>
    <ReflectScreen
      userEmail={userEmail}
      onDone={data => { setInsightData(data); setReflecting(false); }}
    /></>
  );

  if (insightData) return (
    <><style>{CSS}</style>
    <InsightScreen
      data={insightData}
      onBack={() => { setInsightData(null); setTab("home"); }}
    /></>
  );

  const tabs = [
    { id: "home", label: "Início", icon: "🏠" },
    { id: "history", label: "Histórico", icon: "📖" },
    { id: "weekly", label: "Semana", icon: "📊" },
  ];

  return (
    <><style>{CSS}</style>
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <div style={{
        padding: "14px 20px", background: C.white,
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <Logo />
        <button onClick={logout} style={{
          background: "none", border: "none",
          fontSize: 12, color: C.muted, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
        }}>Sair</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
        {tab === "home" && <HomeScreen userEmail={userEmail} onReflect={() => setReflecting(true)} />}
        {tab === "history" && <HistoryScreen userEmail={userEmail} />}
        {tab === "weekly" && <WeeklyScreen userEmail={userEmail} />}
      </div>

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: C.white, borderTop: `1px solid ${C.border}`,
        display: "flex", padding: "8px 0 12px", zIndex: 10,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, background: "none", border: "none",
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 3, cursor: "pointer", padding: "6px 0",
          }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: tab === t.id ? C.coral : C.muted2, transition: "color 0.2s" }}>
              {t.label}
            </span>
            {tab === t.id && (
              <div style={{ width: 20, height: 2, borderRadius: 2, background: GRAD, marginTop: 1 }} />
            )}
          </button>
        ))}
      </div>
    </div>
    </>
  );
}
