# Thulirkum Ver — Fast Store Loading Fix

This version keeps the existing UI/design and changes the data-loading behavior only.

## What was fixed

- Backend catalogue data is cached in the browser after the first successful load.
- Home/shop/offers/authors/home-section/home-settings data is shown from cache immediately after refresh.
- Cached customer account data (cart, wishlist and saved addresses) is shown immediately after refresh/login.
- Fresh backend data is fetched in the background and replaces the cache when available.
- A temporary Render/backend/network delay no longer clears already-visible catalogue/account data.
- Cart add, quantity increase/decrease and remove operations update the UI optimistically.
- Wishlist add/remove updates the UI optimistically.
- Rapid cart/wishlist actions are queued so API responses cannot arrive out of order and overwrite a newer action.
- Catalogue stock refresh after cart changes happens in the background instead of blocking the interaction.
- React StrictMode development double-fetching is guarded for the store bootstrap/account load.

## Important

The cache is only an acceleration layer. Backend data remains the source of truth. If a backend request succeeds, the fresh response replaces the cached data.

No hardcoded catalogue data was added by this performance fix.
