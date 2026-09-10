# Thulirkum Ver — Premium UI Revision

This revision keeps the existing React/API behaviour and refines the approved cream + forest-green bookstore direction.

## Home page fixes
- Rebuilt header and navigation spacing for a clean single alignment grid.
- Replaced the blurry low-resolution hero crop with a new high-resolution local hero visual.
- Replaced the old offer crop with a clean high-resolution local offer visual.
- Featured book cards now use real high-resolution cover URLs when available, with crisp local SVG fallbacks.
- Featured author cards use real portrait URLs with a safe local fallback.
- Increased card cover area, typography, button sizing and spacing.
- Restored all five navigation categories even when the API is unavailable.
- Added exact badge treatments: Bestseller, 20% OFF, New and Popular.

## Cleanup
- Removed the old low-resolution `public/refcrops` assets.
- Removed the unused duplicate demo book data file.
- Removed unused author placeholder SVG files, keeping only the required fallback.
- Consolidated the latest home-page overrides into a single premium V3 CSS section.

## Run
```bash
npm install
npm run dev
```

The backend/API source was not included in the original ZIP, so existing API contracts are unchanged.
