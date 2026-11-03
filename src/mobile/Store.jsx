/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Pocket Studio: Spider Store (browse + publish)
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Check, ImagePlus, Layers, Package, Rocket, ShieldCheck, Store as StoreIcon, X, AlertTriangle, Clock } from "lucide-react";
import {
  LIMITS, RULES, STORE_CATEGORIES, buildPackage, buildProvenance, checkListing, findGame, formatBytes, listGames, processImage,
  rememberDeveloper, resolveTarget, savedDeveloper, storeMode, submitGame,
} from "./storeApi.js";
import { cx } from "./ui.jsx";
import "./store.css";

function Head({ title, onBack, right }) {
  return (
    <header className="sp-page-head">
      {onBack && <button type="button" className="sp-icon-btn" onClick={onBack} aria-label="Back"><ChevronLeft size={22} /></button>}
      <h1>{title}</h1>
      <span className="sp-grow" />
      {right}
    </header>
  );
}

const hue = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const Cover = ({ game, className }) => (
  game.images?.[0]
    ? <img className={cx("st-cover", className)} src={game.images[0].dataUrl || game.images[0].url} alt="" loading="lazy" />
    : <span className={cx("st-cover st-cover-fallback", className)} style={{ background: `linear-gradient(135deg, hsl(${hue(game.name)} 70% 56%), hsl(${(hue(game.name) + 60) % 360} 70% 38%))` }}>{game.name.slice(0, 1)}</span>
);

/* ----------------------------- game page ----------------------------- */
function GamePage({ slug, onBack }) {
  const [game, setGame] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { findGame(slug).then(setGame).catch((e) => setErr(e.message)); }, [slug]);
  if (err) return <><Head title="Game" onBack={onBack} /><p className="st-note is-bad">{err}</p></>;
  if (!game) return <><Head title="Game" onBack={onBack} /><p className="st-note">Loading…</p></>;
  const latest = game.versions[0];
  return (
    <>
      <Head title={game.name} onBack={onBack} />
      <div className="sp-scroll st-page">
        <div className="st-hero">
          <Cover game={game} className="st-hero-art" />
          <div className="st-hero-text">
            <h2>{game.name}</h2>
            <p>{game.developer}</p>
            <span className="st-pill">{game.category}</span>
          </div>
        </div>
        <div className="st-shots" role="list">
          {game.images.map((im) => <img key={im.sha256 || im.name} role="listitem" src={im.dataUrl || im.url} alt={`${game.name} screenshot`} loading="lazy" />)}
        </div>
        <section className="st-block">
          <h3>About</h3>
          <p className="st-text">{game.description}</p>
        </section>
        <section className="st-block">
          <h3>Versions</h3>
          <ul className="st-versions">
            {game.versions.map((v, i) => (
              <li key={v.version}>
                <b>Version {v.version}{i === 0 && <em> Latest</em>}</b>
                <small>{new Date(v.createdAt).toLocaleDateString()} · {formatBytes(v.bytes)}</small>
                {v.notes && <p>{v.notes}</p>}
              </li>
            ))}
          </ul>
        </section>
        <p className="st-foot"><ShieldCheck size={14} /> Screenshots are metadata-free. Provenance recorded for version {latest.version}.</p>
      </div>
    </>
  );
}

/* ----------------------------- browse ----------------------------- */
export function StoreBrowse({ onBack, onPublish }) {
  const [games, setGames] = useState(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(null);
  const [cat, setCat] = useState("All");
  const reload = useCallback(() => { listGames().then(setGames).catch((e) => setErr(e.message)); }, []);
  useEffect(reload, [reload]);
  if (open) return <GamePage slug={open} onBack={() => setOpen(null)} />;
  const shown = (games || []).filter((g) => cat === "All" || g.category === cat);
  const cats = ["All", ...new Set((games || []).map((g) => g.category))];
  return (
    <>
      <Head title="Spider Store" onBack={onBack} right={<button type="button" className="sp-btn is-primary" onClick={onPublish}><Rocket size={16} /> Publish</button>} />
      <div className="sp-scroll st-page">
        <div className="st-banner">
          <StoreIcon size={26} />
          <div><b>Games made with Spider Engine</b><small>{storeMode() === "server" ? "Live from the Spider Store" : "Local preview: submissions stay on this device until the Store server is connected"}</small></div>
        </div>
        {err && <p className="st-note is-bad">{err}</p>}
        {games && cats.length > 2 && (
          <div className="sp-chips sp-chips-row">
            {cats.map((c) => <button key={c} type="button" className={cx("sp-chip", cat === c && "is-on")} onClick={() => setCat(c)}>{c}</button>)}
          </div>
        )}
        {games && !shown.length && (
          <div className="st-empty">
            <span><Package size={30} /></span>
            <b>No games yet</b>
            <small>Be the first. Build a game, then publish it from here.</small>
            <button type="button" className="sp-btn is-primary" onClick={onPublish}><Rocket size={16} /> Publish a game</button>
          </div>
        )}
        <ul className="st-grid">
          {shown.map((g) => (
            <li key={g.slug}>
              <button type="button" className="st-card" onClick={() => setOpen(g.slug)}>
                <Cover game={g} />
                <b>{g.name}</b>
                <small>{g.developer}</small>
                <span className="st-meta">{g.category}{g.versions.length > 1 ? ` · v${g.versions[0].version}` : ""}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/* ----------------------------- publish ----------------------------- */
function Step({ n, title, hint, done, children }) {
  return (
    <section className="st-step">
      <header>
        <span className={cx("st-num", done && "is-done")}>{done ? <Check size={14} strokeWidth={3} /> : n}</span>
        <div><h3>{title}</h3>{hint && <small>{hint}</small>}</div>
      </header>
      {children}
    </section>
  );
}

export function StorePublish({ s, notify, onBack, onDone }) {
  const [developer, setDeveloper] = useState(savedDeveloper());
  const [name, setName] = useState(s.project.name || "");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState([]);
  const [busyImg, setBusyImg] = useState(0);
  const [rules, setRules] = useState({});
  const [target, setTarget] = useState(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const file = useRef(null);

  const pkg = useMemo(() => buildPackage(s.project), [s.project]);
  const tooBig = pkg.bytes > LIMITS.maxGameBytes;
  const problems = checkListing({ name, developer, category, description });
  const ruleOk = RULES.every((r) => rules[r.id]);
  const imagesOk = images.length >= LIMITS.minImages;
  const ready = !problems.length && imagesOk && ruleOk && !tooBig && target?.kind !== "taken" && !busyImg;

  // What would this submission do? (new game, new version, or the name is taken)
  useEffect(() => {
    if (!name.trim() || !developer.trim()) { setTarget(null); return undefined; }
    let live = true;
    const t = setTimeout(() => { resolveTarget({ name, developer }).then((r) => live && setTarget(r)).catch(() => live && setTarget(null)); }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [name, developer]);

  const addFiles = async (list) => {
    const room = LIMITS.maxImages - images.length;
    const picked = [...list].slice(0, Math.max(0, room));
    if (list.length > picked.length) notify(`Up to ${LIMITS.maxImages} screenshots`, "warn");
    setBusyImg((n) => n + picked.length);
    for (const f of picked) {
      try {
        const im = await processImage(f);
        setImages((cur) => (cur.some((x) => x.sha256 === im.sha256) ? cur : [...cur, im]));
      } catch (e) {
        notify(e.message, "warn");
      } finally {
        setBusyImg((n) => n - 1);
      }
    }
  };

  const submit = async () => {
    if (!ready || sending) return;
    setSending(true);
    setErr("");
    try {
      const fresh = await resolveTarget({ name, developer });
      if (fresh.kind === "taken") throw new Error(`"${fresh.existing.name}" already belongs to ${fresh.existing.developer}. Pick another name.`);
      const dev = developer.trim();
      const provenance = await buildProvenance({ developer: dev, name: name.trim(), version: fresh.version, pkg, images });
      const game = await submitGame({
        slug: fresh.slug, name: name.trim(), developer: dev, category, description: description.trim(), notes: notes.trim(), version: fresh.version,
        images: images.map(({ id, name: n, type, width, height, bytes, sha256, dataUrl }) => ({ id, name: n, type, width, height, bytes, sha256, dataUrl })),
        package: { bytes: pkg.bytes, base64: btoa(unescape(encodeURIComponent(pkg.body))) },
        provenance,
      });
      rememberDeveloper(dev);
      setResult({ game, kind: fresh.kind, version: fresh.version });
      s.log?.("Success", `Published ${game.name} v${fresh.version} to the Spider Store`);
    } catch (e) {
      setErr(e.message || "Could not publish.");
    } finally {
      setSending(false);
    }
  };

  if (result) {
    return (
      <>
        <Head title="Published" onBack={onDone} />
        <div className="sp-scroll st-page st-success">
          <span className="st-tick"><Check size={34} strokeWidth={3} /></span>
          <h2>{result.kind === "version" ? `Version ${result.version} is live` : "Your game is live"}</h2>
          <p>{result.game.name} {result.kind === "version" ? "was added under the same game." : `by ${result.game.developer} is in the Spider Store.`}</p>
          <button type="button" className="sp-btn is-primary is-block" onClick={onDone}>View in the Store</button>
        </div>
      </>
    );
  }

  return (
    <>
      <Head title="Export to Store" onBack={onBack} />
      <div className="sp-scroll st-page st-form">
        <div className="st-lead">
          <h2>Publish {s.project.name}</h2>
          <p>Four steps. The listing is checked on this device before anything is sent.</p>
        </div>

        <Step n={1} title="About you and the game" done={!problems.length}>
          <label className="sp-field"><span>Developer name</span>
            <input value={developer} onChange={(e) => setDeveloper(e.target.value)} placeholder="Your name or studio" autoComplete="nickname" /></label>
          <label className="sp-field"><span>Game name</span>
            <input value={name} maxLength={LIMITS.nameMax + 10} onChange={(e) => setName(e.target.value)} placeholder="Neon Rift" /></label>
          <div className="sp-field"><span>Category</span>
            <div className="sp-chips">{STORE_CATEGORIES.map((c) => <button key={c} type="button" className={cx("sp-chip", category === c && "is-on")} onClick={() => setCategory(c)}>{c}</button>)}</div></div>
          <label className="sp-field"><span>Description <em className="st-count">{description.length}/{LIMITS.descMax}</em></span>
            <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What do you do in this game? What makes it fun?" /></label>
          {target?.kind === "version" && (
            <p className="st-note is-info"><Layers size={15} /> “{target.existing.name}” is already in the Store. This will be added under the same game as version {target.version}.</p>
          )}
          {target?.kind === "version" && (
            <label className="sp-field"><span>What changed in this version</span>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="New level, bug fixes…" /></label>
          )}
          {target?.kind === "taken" && (
            <p className="st-note is-bad"><AlertTriangle size={15} /> “{target.existing.name}” already belongs to {target.existing.developer}. Choose another name.</p>
          )}
        </Step>

        <Step n={2} title="Screenshots" hint={`At least ${LIMITS.minImages}, up to ${LIMITS.maxImages}`} done={imagesOk}>
          <div className="st-thumbs">
            {images.map((im) => (
              <figure key={im.id}>
                <img src={im.dataUrl} alt="" />
                <button type="button" aria-label="Remove screenshot" onClick={() => setImages((c) => c.filter((x) => x.id !== im.id))}><X size={14} /></button>
                <figcaption>{formatBytes(im.bytes)}</figcaption>
              </figure>
            ))}
            {images.length < LIMITS.maxImages && (
              <button type="button" className="st-add" onClick={() => file.current?.click()} disabled={!!busyImg}>
                <ImagePlus size={22} /><span>{busyImg ? "Processing…" : "Add"}</span>
              </button>
            )}
          </div>
          <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => { const l = e.target.files; if (l?.length) addFiles(l); e.target.value = ""; }} />
          <p className="st-foot"><ShieldCheck size={14} /> Each image is compressed and its metadata (location, camera, edit history) is removed on this device. {images.length > 0 && `${images.length} of ${LIMITS.minImages} needed.`}</p>
        </Step>

        <Step n={3} title="Game package" done={!tooBig}>
          <div className={cx("st-size", tooBig && "is-bad")}>
            <Package size={20} />
            <div><b>{formatBytes(pkg.bytes)}</b><small>Limit {formatBytes(LIMITS.maxGameBytes)}</small></div>
            <i style={{ "--w": `${Math.min(100, (pkg.bytes / LIMITS.maxGameBytes) * 100)}%` }} />
          </div>
          {tooBig && (
            <p className="st-note is-warn"><Clock size={15} /> Games over 5 MB need an additional review with team support and a verified developer account. That process is coming soon. Reduce textures or models to publish now.</p>
          )}
        </Step>

        <Step n={4} title="Store rules" done={ruleOk}>
          <ul className="st-rules">
            {RULES.map((r) => (
              <li key={r.id}>
                <button type="button" role="checkbox" aria-checked={!!rules[r.id]} className={cx(rules[r.id] && "is-on")} onClick={() => setRules((c) => ({ ...c, [r.id]: !c[r.id] }))}>
                  <span><Check size={14} strokeWidth={3} /></span>{r.text}
                </button>
              </li>
            ))}
          </ul>
        </Step>

        {err && <p className="st-note is-bad"><AlertTriangle size={15} /> {err}</p>}
        {!ready && !sending && (problems[0] || (!imagesOk && `Add ${LIMITS.minImages - images.length} more screenshot${LIMITS.minImages - images.length > 1 ? "s" : ""}.`) || (!ruleOk && "Accept the Store rules.") || (tooBig && "The package is over the size limit.")) && (
          <p className="st-hint">{problems[0] || (!imagesOk && `Add ${LIMITS.minImages - images.length} more screenshot${LIMITS.minImages - images.length > 1 ? "s" : ""}.`) || (!ruleOk && "Accept the Store rules.") || "The package is over the size limit."}</p>
        )}
        <button type="button" className="sp-btn is-primary is-block st-submit" disabled={!ready || sending} onClick={submit}>
          <Rocket size={18} /> {sending ? "Publishing…" : target?.kind === "version" ? `Publish version ${target.version}` : "Publish to Store"}
        </button>
      </div>
    </>
  );
}

/** The Store tab in the bottom bar: browse, and publish from the same place. */
export function StoreTab({ s, notify }) {
  const [view, setView] = useState("browse");
  return (
    <section className="sp-page">
      {view === "publish"
        ? <StorePublish s={s} notify={notify} onBack={() => setView("browse")} onDone={() => setView("browse")} />
        : <StoreBrowse onPublish={() => setView("publish")} />}
    </section>
  );
}
