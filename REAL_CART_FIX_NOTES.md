# Thulirkum Ver — Real Cart/Refresh Fix

This patch fixes the data-hydration problem across StoreContext, CartPage,
AuthContext, and the API client.

## Main fix

The cart page was using `cartRows()` as if an empty array always meant
"the cart is empty". But cartRows depends on BOTH:
- the customer's `/account` response
- the `/books` catalogue response

During refresh those two requests can finish at different times. The UI could
therefore render an empty cart even when the backend cart already contained
items.

The patched code separates:
- accountReady
- accountLoading
- catalogueReady

and does not render the true empty-cart state until the required data has been
resolved.

## Other fixes

- stale account responses cannot overwrite newer cart mutations
- cart order is preserved when server responses arrive
- new cart items are appended instead of reordering existing items
- add-to-cart uses existing quantity + added quantity optimistically
- cached v3/v4/v5 account/catalogue data can still be read
- customer 401 responses clear the invalid session instead of leaving a
  protected page mounted with an unusable account
- cart book snapshots are used while catalogue data is being hydrated

## Important environment check

The frontend API client falls back to:

    http://localhost:8080/api

If you are using the deployed Render backend, your local frontend `.env.local`
must contain:

    VITE_API_URL=https://thulirkumver-backend.onrender.com/api

After changing `.env.local`, completely restart Vite (`npm run dev`).

If you intentionally run the backend locally on port 8080, keep the localhost
value instead.
