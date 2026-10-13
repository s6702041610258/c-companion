# Landing design 1.12

Audience: learners starting C programming. Primary action: open the chat; secondary: inspect prepared examples or install using the manual.

Approved direction: C COMPANION in oversized display type, soft green/white environment, existing green dragon, and a physical open-book landscape. Scrolling moves the camera and display type gently; reading sections stay stable. The name wraps deliberately on mobile and never requires interaction to be read.

Palette: ink #173d32, jade #23624c, muted #536c60, paper #fcfdf9, mist #e7f1e9, line #ccdcd2. Arial/Helvetica display lettering; existing Noto Sans Thai for Thai content and UI. Typography alignment: large brand centered; explanation left; hero illustration right on desktop, stacked on mobile.

Implementation: original React/Next static landing and procedural Three.js scene, with GSAP controlling scroll progress. No extra package or third-party binary assets. The Kage reference informed depth, large lettering and scroll composition; the temple narrative is replaced by the existing C Companion learning story.

Protect: web/src and app stay unchanged. Chat bundle must not load landing dependencies. No AI requests from examples. Keep source links, local-install explanation, no-account behavior and content limitations honest.
