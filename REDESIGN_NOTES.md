# Thulirkum Ver — UI Redesign

This version applies the approved cream + forest-green editorial bookstore design across the customer and admin experiences.

## Redesigned
- Global top bar, header, search, navigation and footer
- Home page
- All Books / Shop filters and 12-book pagination
- Book Details page
- Cart page
- Checkout page
- Wishlist page
- Order Confirmation page
- My Account / order tracking / addresses
- Offers page
- Customer login / registration
- Admin login
- Admin dashboard, tables, forms, inventory, customers, authors and offers

## CSS cleanup
- Removed the legacy `concept-c.css` file.
- Replaced the previous 6,000+ line legacy stylesheet with one clean `src/styles.css` design system.
- Removed stale V4/V6/V7/Concept visual layers while keeping the current React/API behavior.

## Run
```bash
npm install
npm run dev
```

The backend/API source was not included in the original ZIP, so API endpoints and contracts were kept intact.
