# 🕸️ Spiderweb-Komponente — Erklärung

Diese Doku erklärt, **was wo passiert** in der Spiderweb-Komponente, damit du sie verstehen und
anpassen kannst. Der Code selbst ist zusätzlich englisch kommentiert — hier ist der zusammenhängende
Überblick + ein Nachschlagewerk.

---

## 1. Was ist das?

Ein interaktives **SVG-Spinnennetz**, in dem Tech-Skills als Icons hängen. Fährst du mit der Maus über
einen **Haupt-Skill**, „kriecht" eine leuchtende Linie (Glow) **am Netz entlang** zu seinen
**Subskills**, die sich dabei nacheinander einblenden. Gleichzeitig **wackeln** die Netzstränge leicht,
als würde man an ihnen zupfen. Alles ohne externe Animations-Library — nur eine kleine Physik-Schleife,
eine Graphensuche und CSS.

Im Ruhezustand hängen **nur die Haupt-Skills** im Netz (aufgeräumt); die Subskills erscheinen erst beim
Hover.

---

## 2. Dateien im Überblick

| Datei | Rolle |
|---|---|
| [`spiderweb.ts`](./spiderweb.ts) | **Component**: Signals/State, requestAnimationFrame-Loop, Hover → Glow-Berechnung, Reveal der Subskills. |
| [`spiderweb.html`](./spiderweb.html) | Das **handgezeichnete SVG**: Basis-Netz-Pfade, Glow-Overlay-Layer, Skill-Knoten, Reveal-Loop, Infobox. |
| [`spiderweb.scss`](./spiderweb.scss) | Styling: blasses Netz, `.glow`, `.glow-line` (Crawl-Keyframe), `.sub-reveal` (Fade-In). |
| [`spiderweb.config.ts`](./spiderweb.config.ts) | **Reine Geometrie-Daten**: `WOBBLE_THREAD_GEOMETRY`, `CHAIN_GROUPS` (+`sim`), `ROCK_GROUPS`, `PATH_ANCHORS`. |
| [`spiderweb.routing.ts`](./spiderweb.routing.ts) | **Graph + Dijkstra** (`routeSegments`) — findet den Glow-Pfad durchs Netz. |
| [`spiderweb.physics.ts`](./spiderweb.physics.ts) | **Feder-Simulation**: `ThreadPendulum`, `ThreadChain`, `RockingChain`, `PinnedChain` + Junction-Kopplung. |
| [`../../../mapper/spiderweb.mapper.ts`](../../../mapper/spiderweb.mapper.ts) | Wandelt die Strapi-Antwort in `Skill[]` um. |
| [`../../../interfaces/organism.interface.ts`](../../../interfaces/organism.interface.ts) | Das `Skill`-Interface. |

**Merksatz zur Trennung:** `config.ts` = *Daten*, `routing.ts` = *Wegfindung*, `physics.ts` = *Bewegung*,
`spiderweb.ts` = *Orchestrierung*, `.html`/`.scss` = *Darstellung*.

---

## 3. Datenfluss (von Strapi bis zum Icon)

```
Strapi                         Angular
┌─────────────────────────┐    ┌───────────────────────────────────────────┐
│ skill-Collection         │    │ router.ts baut Auto-Populate               │
│ spider_tech_web-Komp.    │──▶ │  /api/page-by-path?path=/                  │
│  └─ skills[] (Relation)  │    │        │                                   │
└─────────────────────────┘    │        ▼                                   │
                               │ mapSpiderwebData()  →  Skill[]             │
                               │        │                                   │
                               │        ▼                                   │
                               │ <lpd-spider-web [skills]="…">              │
                               │   → rendert Knoten + Glow + Physik         │
                               └───────────────────────────────────────────┘
```

- **Strapi**: Jeder Skill ist ein Eintrag der `skill`-Collection. Die Startseiten-Komponente
  `spider_tech_web` hat eine `skills`-Relation — **diese Liste** bestimmt, welche Icons im Netz hängen.
- **`router.ts`** (Strapi, `src/api/router/controllers/router.ts`) populiert automatisch tief genug,
  inkl. `logo` und `subskills`.
- **`mapSpiderwebData`** macht daraus flache `Skill`-Objekte (Position, `connectedPathIds`,
  `glowPathIds`, verschachtelte `subskills`, Bild-URL).
- **`SpiderWebComponent`** bekommt das als `skills`-Input und rendert.

> ⚠️ Wichtig: Gerendert wird **ein Knoten pro Top-Level-Skill** in `skills`. Verschachtelte Subskills
> bekommen **keinen** eigenen Dauer-Knoten — sie erscheinen nur beim Hover ihres Mains (siehe §4c).

---

## 4. Die drei Subsysteme

### a) Physik — warum das Netz wackelt · [`spiderweb.physics.ts`](./spiderweb.physics.ts)

Alles basiert auf derselben **gedämpften Feder** (Hooke'sches Gesetz + Reibung), integriert mit
**semi-impliziter Euler-Methode**:

```
beschleunigung = -steifigkeit * (x - ruhelage)  -  dämpfung * geschwindigkeit
geschwindigkeit += beschleunigung * dt      // erst Geschwindigkeit …
x               += geschwindigkeit * dt      // … dann Position bewegen
```

Ein „Kick" gibt Geschwindigkeit rein, die Feder zieht zurück, die Dämpfung nimmt Energie raus → es
schwingt kurz nach und beruhigt sich. `step()` meldet `false`, sobald die Bewegung unter eine Schwelle
fällt — dann **schläft** die Animations-Schleife wieder.

**Vier Körper-Typen** (unterscheiden sich nur darin, *was* schwingt):

| Typ | Enden | Bewegung | Wofür |
|---|---|---|---|
| `ThreadPendulum` | 1 fix (oben) | Winkel pendelt | die hängenden Icon-Fäden |
| `ThreadChain` | 1 fix | gekoppelte Glieder, Welle | (aktuell ungenutzt) |
| `RockingChain` | **beide fix** | nur der Bogen wölbt sich | horizontale Bögen + Verbinder (`sim: 'rock'`) |
| `PinnedChain` | **beide fix** | zusammenhängende Welle läuft durch | die Radial-Speichen (`sim: 'pinned'`) |

- Welcher Typ genutzt wird, entscheidet das **`sim`-Flag** in `CHAIN_GROUPS` (siehe `buildChain()` in
  [`spiderweb.ts`](./spiderweb.ts)).
- **`PinnedChain`** beschränkt die Welle auf den **beleuchteten Abschnitt** (die gekickten Segmente) und
  hält beide Enden fest → die Speiche wackelt nur dort, wo der Glow verläuft, und peitscht nicht am
  Ast-Ende.
- **Junction-Kopplung**: Wenn eine `PinnedChain` einen gemeinsamen Knotenpunkt bewegt, folgen die dort
  andockenden Bögen/Verbinder minimal mit (über `publishShifts` / `junctionShiftAt`), damit nichts
  optisch abreißt.
- Die Schleife (`tick`) läuft nur, solange sich etwas bewegt (Performance).

### b) Glow-Routing — der Weg durchs Netz · [`spiderweb.routing.ts`](./spiderweb.routing.ts)

Das Netz wird in einen **Graphen** übersetzt: Kreuzungspunkte = Knoten, Segmente = gewichtete Kanten
(Gewicht = Pixel-Länge). Knoten-Identität kommt vom **Bucketing** (Runden auf ein 5px-Raster), damit
zwei Segment-Enden am selben Punkt zu einem Knoten verschmelzen. Thread-Anker werden zusätzlich auf den
nächsten echten Knoten **gesnappt** (`SNAP_TOL`), falls sie knapp neben einer Rasterlinie liegen.

`routeSegments(main, sub)` läuft dann **Dijkstra** (kürzester Weg) zwischen den beiden Icons. Weil beide
Icons *draußen* im Netz sitzen (nicht im Zentrum), führt der kürzeste Weg über einen horizontalen Bogen
statt durchs Zentrum — deshalb trichtert der Glow nicht mehr in die Mitte. Ein kleiner **Zufalls-Jitter**
(`ROUTE_JITTER`) sorgt dafür, dass fast gleich lange Wege pro Hover leicht variieren.

Jede Route liefert die Segmente **in Laufrichtung** mit einem `reversed`-Flag (aus welcher Richtung das
Segment gezeichnet werden muss). In [`spiderweb.ts`](./spiderweb.ts) wird daraus die **Crawl-Animation**:
pro Segment `delay` (= Summe der vorherigen Dauern → fließt nacheinander), `dur` (∝ Länge, konstante
Geschwindigkeit via `GLOW_SPEED`) und `from` (Zeichenrichtung). Gerendert wird als **Overlay-Layer**
über dem unveränderten Netz, damit das blasse Netz sichtbar bleibt.

### c) Hover-Reveal — Subskills einblenden · [`spiderweb.ts`](./spiderweb.ts) + `.html`/`.scss`

- Beim Hover eines Mains berechnet `buildGlow()` die Routen **und** merkt sich pro Subskill die
  **Ankunftszeit** des Glows.
- `onHover` setzt das Signal **`subReveal`** (Liste der Subskills + Delay); der zweite `@for`-Block in
  [`spiderweb.html`](./spiderweb.html) rendert deren Icons an ihren `connectedPathIds`-Positionen.
- Das CSS `.sub-reveal` (Keyframe `sub-fade-in`) blendet jedes Icon mit `--reveal-delay` = Ankunftszeit
  ein → das Icon erscheint genau, wenn der Glow ankommt.
- `onLeave` leert alles wieder. Die eingeblendeten Subskills sind **reine Anzeige** (kein eigenes
  Hover); die Infobox zeigt den gehoverten Main.

---

## 5. Strapi-Content-Modell — so fügst du Skills hinzu

**Felder eines `skill`:** `name`, `uid` (aus `name`), `logo` (Bild), `position_x`/`position_y`,
`connectedPathIds` (Hängepunkt), `glowPathIds` (optionaler manueller Glow-Override), Relationen
`subskills` und `skills`.

**Regeln, damit alles erscheint:**
1. **Nur Haupt-Skills** in die `skills`-Liste der `spider_tech_web`-Komponente legen.
2. Die übrigen Skills **nur** als **`subskills`-Relation** an ihren Main hängen — sie erscheinen
   automatisch beim Hover.
3. Jeder Skill (Main + Sub) braucht einen **eindeutigen `connectedPathIds`**. Fehlt er, landet der
   Skill auf dem Default **(185, 183) = Zentrum** und stapelt sich dort mit anderen.
4. Skills müssen **Published** sein (Drafts liefert die API nicht).

**Verfügbare Hängepunkte (`connectedPathIds`):**
- 6 hängende Threads für den „baumelnden" Look: `subskill-1` … `subskill-6`.
- Alle weiteren: Chain-IDs aus `PATH_ANCHORS` (z. B. `top-middle-5`, `right-7`, `bottom-left-third-4`)
  — diese Icons sitzen direkt auf den Netzlinien.

---

## 6. „Wo ändere ich X?" — Schnellreferenz

| Was du willst | Wo | Konstante / Stelle |
|---|---|---|
| Radial-Speichen wackeln stärker/schwächer | `spiderweb.ts` | `kickImpulseFor()` (PinnedChain-Zweig) |
| Wellen-Frequenz / Abklingen der Speichen | `spiderweb.physics.ts` | `STRING_TENSION` / `STRING_DAMPING` |
| Glow-Kriechgeschwindigkeit | `spiderweb.ts` | `GLOW_SPEED` (px/s), `GLOW_MIN_DUR` |
| Wie stark die Route zufällig variiert | `spiderweb.routing.ts` | `ROUTE_JITTER` |
| Glow-Farbe / -Dicke / -Schein | `spiderweb.scss` | `.glow-line` |
| Einblend-Dauer der Subskills | `spiderweb.scss` | `.sub-reveal` / `@keyframes sub-fade-in` |
| Icon-Größe / „ins Feld einpassen" | `spiderweb.html` | `<image>` `width`/`height` + `preserveAspectRatio` |
| Thread-Anker verbindet sich nicht ans Netz | `spiderweb.routing.ts` | `SNAP_TOL` (Snap-Radius) erhöhen |
| Strang soll fixe Enden statt frei schwingen | `spiderweb.config.ts` | `sim: 'rock'` bzw. `'pinned'` an der Gruppe |

---

## 7. Glossar

- **Dijkstra** — klassischer Algorithmus für den *kürzesten Weg* in einem gewichteten Graphen: nimmt
  immer den nächstgelegenen unbesuchten Knoten und aktualisiert („relaxiert") die Distanzen seiner
  Nachbarn, bis das Ziel feststeht.
- **Bucketing** — Koordinaten auf ein Raster runden, damit nahezu gleiche Punkte denselben Schlüssel
  (= denselben Knoten) bekommen.
- **Semi-implizite Euler-Integration** — einfaches Zeitschritt-Verfahren: erst die Geschwindigkeit
  aktualisieren, dann mit der *neuen* Geschwindigkeit die Position — stabiler als „normales" Euler.
- **Quadratische Bézier** — SVG-Kurve `M sx sy Q cx cy ex ey`: von Start nach Ende, gebogen Richtung
  eines Kontrollpunkts.
- **`preserveAspectRatio`** — `meet` = ganzes Bild einpassen (nichts abschneiden, `object-fit: contain`);
  `slice` = formatfüllend, Überstand abschneiden (`object-fit: cover`).
```
