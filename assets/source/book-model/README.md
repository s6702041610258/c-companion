# C Companion book model

Display model of the book cover supplied by the user on 13 October 2026.
Title and author credit are preserved: **C Companion — Soradech Krootjohn**.
The spine and back are simple visual approximations because only the front cover was supplied.

- `cover.png`: supplied cover image, unchanged.
- `cover.jpg`: web texture encoded from that image.
- `build_book.py`: Blender construction and GLB export, run in a dedicated new file only.
- Web asset: `landing/public/models/c-companion-book.gltf` with its `.bin` and `book-textures/cover.jpg`; separate same-origin texture supports the existing CSP.

The exported book stands at the origin on its bottom edge, Y-up, front facing +Z.
Includes front/back cover boards, spine and hinge grooves, ivory page block,
fine page-edge geometry and a small ribbon. The web scene supplies its own plinth.
The downloadable GLB embeds its cover; the web variant loads the cover from the same website.

The cover is book artwork, not part of the project's MIT-licensed original code.
See `book/NOTICE.md` for the bundled book's rights. The model does not change or
extend those rights or imply authorship of the book by the web developers.
