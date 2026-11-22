import "./globals.css";
import "leaflet/dist/leaflet.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata = {
  title: "RoadSense AI — Road Defect & Municipal Platform",
  description:
    "AI-powered road monitoring, pothole detection, spatial deduplication, and municipal maintenance management.",
};

// Inline tokens injected by ThemeProvider (same as THEME_TOKENS in ThemeProvider.jsx)
// Keeping them in sync here ensures zero-flash SSR hydration.
const INLINE_TOKENS = {
  "midnight-blue": {
    "--background":"227 57% 6%","--foreground":"210 40% 96%","--card":"223 50% 10%","--card-foreground":"210 40% 96%",
    "--popover":"223 50% 10%","--popover-foreground":"210 40% 96%","--primary":"217 91% 60%","--primary-foreground":"0 0% 100%",
    "--secondary":"222 47% 15%","--secondary-foreground":"183 100% 50%","--muted":"222 40% 14%","--muted-foreground":"215 20% 65%",
    "--accent":"223 45% 15%","--accent-foreground":"183 100% 50%","--destructive":"348 100% 61%","--destructive-foreground":"0 0% 100%",
    "--border":"222 43% 18%","--input":"222 43% 18%","--ring":"217 91% 60%",
    "--brand-glow":"rgba(59,130,246,0.35)","--brand-accent-glow":"rgba(0,242,254,0.25)",
  },
  "cyber-purple": {
    "--background":"257 56% 6%","--foreground":"270 100% 98%","--card":"256 50% 11%","--card-foreground":"270 100% 98%",
    "--popover":"256 50% 11%","--popover-foreground":"270 100% 98%","--primary":"271 91% 65%","--primary-foreground":"0 0% 100%",
    "--secondary":"257 45% 16%","--secondary-foreground":"349 89% 60%","--muted":"257 40% 15%","--muted-foreground":"270 60% 75%",
    "--accent":"257 45% 17%","--accent-foreground":"271 91% 65%","--destructive":"349 89% 60%","--destructive-foreground":"0 0% 100%",
    "--border":"257 47% 22%","--input":"257 47% 22%","--ring":"271 91% 65%",
    "--brand-glow":"rgba(168,85,247,0.35)","--brand-accent-glow":"rgba(244,63,94,0.25)",
  },
  "emerald-tech": {
    "--background":"158 71% 4%","--foreground":"152 81% 96%","--card":"160 65% 8%","--card-foreground":"152 81% 96%",
    "--popover":"160 65% 8%","--popover-foreground":"152 81% 96%","--primary":"160 84% 39%","--primary-foreground":"0 0% 100%",
    "--secondary":"160 55% 12%","--secondary-foreground":"189 94% 43%","--muted":"160 50% 12%","--muted-foreground":"156 72% 67%",
    "--accent":"160 55% 14%","--accent-foreground":"160 84% 39%","--destructive":"0 84% 60%","--destructive-foreground":"0 0% 100%",
    "--border":"157 60% 17%","--input":"157 60% 17%","--ring":"160 84% 39%",
    "--brand-glow":"rgba(16,185,129,0.35)","--brand-accent-glow":"rgba(6,182,212,0.25)",
  },
  "graphite": {
    "--background":"220 20% 5%","--foreground":"210 20% 96%","--card":"218 22% 10%","--card-foreground":"210 20% 96%",
    "--popover":"218 22% 10%","--popover-foreground":"210 20% 96%","--primary":"214 32% 91%","--primary-foreground":"220 20% 5%",
    "--secondary":"217 20% 14%","--secondary-foreground":"199 89% 60%","--muted":"217 20% 14%","--muted-foreground":"218 11% 65%",
    "--accent":"217 20% 16%","--accent-foreground":"199 89% 60%","--destructive":"0 72% 51%","--destructive-foreground":"0 0% 100%",
    "--border":"217 19% 19%","--input":"217 19% 19%","--ring":"199 89% 60%",
    "--brand-glow":"rgba(56,189,248,0.25)","--brand-accent-glow":"rgba(226,232,240,0.15)",
  },
};

function buildTokensString(tokens) {
  return Object.entries(tokens)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="theme-midnight-blue dark" suppressHydrationWarning>
      <head>
        {/*
          FOUC Prevention Script — runs before paint.
          Reads saved theme from localStorage, applies class + CSS vars directly.
          Must stay synchronous (no async/defer).
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  var valid=["midnight-blue","cyber-purple","emerald-tech","graphite"];
  var tokens=${JSON.stringify(INLINE_TOKENS)};
  var saved;
  try{saved=localStorage.getItem("roadsense_theme");}catch(e){}
  var theme=(saved&&valid.indexOf(saved)!==-1)?saved:"midnight-blue";
  var root=document.documentElement;
  valid.forEach(function(t){root.classList.remove("theme-"+t)});
  root.classList.add("theme-"+theme,"dark");
  root.setAttribute("data-theme",theme);
  root.style.colorScheme="dark";
  var t=tokens[theme]||tokens["midnight-blue"];
  Object.keys(t).forEach(function(k){root.style.setProperty(k,t[k])});
})();`,
          }}
        />
      </head>
      <body
        className="min-h-screen bg-background font-sans text-foreground antialiased"
        suppressHydrationWarning
      >
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
