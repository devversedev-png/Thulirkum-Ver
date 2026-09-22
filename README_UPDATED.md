# Thulirkum Ver — Home Content Update

This update keeps the existing CSS/classes intact and adds an isolated `v7` style layer for the new home-content manager.

## Added

- Admin → **Home Sections** manager with one common page and a section dropdown.
- The eight sections:
  - Discounted Books
  - Top Selling Books
  - Highly Featured Books
  - Cashback Books
  - New Arrivals
  - Best Rated Books
  - Trending Books
  - Recommended Books
- Admin can select any number of existing books for each section and save them to MongoDB.
- A book can belong to multiple home sections.
- Customer Home renders only the books assigned to active sections; empty sections stay hidden.
- Admin → Home Sections → **Background Banners** supports up to four image URLs and an active-banner selector for the home hero background.
- Offers now support an optional `bannerImage` and the Home offer banner automatically rotates through active offers.

## New backend API

Public:

- `GET /api/home-sections`
- `GET /api/home-settings`

Admin (JWT + ADMIN role):

- `GET /api/admin/home-sections`
- `PUT /api/admin/home-sections`
- `GET /api/admin/home-settings`
- `PUT /api/admin/home-settings`

## Run

Frontend:

```bash
npm install
npm run dev
```

Backend:

```bash
mvn spring-boot:run
```

Set the backend environment variables from `.env.example` in the Spring Boot runtime environment.
