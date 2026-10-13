# Mongkoi — C Companion Landing mascot

Original short-neck, chubby giraffe modeled in Blender 5.1 through Blender MCP.
Red cotton shirt, cream mesh embroidery “มองคอย” and “MONGKOI”; 59 meshes.
Run create_mascot.py in Blender with OUTPUT_DIR and FONT_PATH (Sarabun Bold) defined.
The script creates a separate scene and exports only its character collection.
GLB and transparent fallback: landing/public/models/. Chat assets are unchanged.

## Environment asset
Powered by Poly Haven: Book Encyclopedia Set 01, John Malcolm.
Source: https://polyhaven.com/a/book_encyclopedia_set_01
License: CC0 https://docs.polyhaven.com/en/faq
Downloaded 1k glTF, imported in Blender, decimated at 0.42, exported as GLB.
Textures are served as same-origin JPEGs to preserve the existing strict CSP; runtime has no third-party requests.
Books are decorative scenery, not the actual C textbook or a source used by the chatbot.

## Performance and motion
Desktop loads ~1.7 MB mascot + ~3 MB books on demand. Mobile skips the books.
Reduced motion, data saving, disabled JavaScript or WebGL/model failure use a PNG.
Scene only renders on camera/pointer/resize updates, suspends when hidden,
aborts pending model requests and disposes GPU resources on unmount.
