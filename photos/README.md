# Drop real photos here

Put JPG / PNG / WebP files in these folders, then run `npm run photos`. They are resized, converted to WebP,
copied into `public/` and switched on automatically (the SVG illustrations are used for anything without a photo).

- `photos/collections/<collection-slug>.jpg` — e.g. `christmas-collection.jpg`, `top-bottom-sets.jpg`, `frocks.jpg`,
  `salwar-sets.jpg`, `festive-wear.jpg`, `signature-collection.jpg`
- `photos/products/<product-slug>-1.jpg` (main) and `<product-slug>-2.jpg` (detail), e.g. `christmas-velvet-frock-red-1.jpg`
  (slugs are listed in `src/lib/mock/specs.ts`)

Run `npm run photos -- --list` to see which are present.
