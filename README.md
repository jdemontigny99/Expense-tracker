# Inpenso (Web)

An installable web app (PWA) for tracking expenses, ported from the
[Inpenso](https://github.com/VintusS/Inpenso) SwiftUI app (MIT, Dragomir Mindrescu).
It has no dependencies and no build step. Your data stays on your device (localStorage).

## Features
- **Home:** money spent this month, budget progress, income/net, a 7-day spending chart, spending by category, recent transactions
- **Analytics:** Overview (cashflow, daily chart, category donut), Trends (6-month chart, category changes), Insights, Budget (status, history, suggested budget)
- **Transactions:** search, type/category filters, sorting, grouped by day, tap to edit, swipe left to delete (with undo)
- **Settings:** theme, currency, default category, custom categories (emoji + color, reorder/hide), JSON backup, CSV export, import (also reads JSON exported by the iOS Inpenso app)
- Works offline after the first visit

## Install on iPhone
1. Host the site (see below) and open the URL in **Safari**.
2. Tap **Share**, then **Add to Home Screen**.
3. Launch it from the home screen. It opens full screen like a native app.

## Hosting with GitHub Pages
Repo **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*,
pick the branch and `/ (root)`, then save. The site will be at
`https://<user>.github.io/<repo>/`.

## Run locally
```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Backups
Data lives in the browser storage for this site. Use **Settings → Export Backup** now and then.
Deleting the home-screen app also deletes its data.
