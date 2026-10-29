# Handled

A web version of the Handled tenant maintenance app, built from the Figma prototype.

Tenants can:

- See their next scheduled maintenance visit and pending work orders
- Create a work order (priority, reason, time, day, entry type, notes, photos), review it and confirm
- Report an issue with maintenance (reasons, description, photos)
- Browse upcoming, pending and past orders, view details and cancel an order
- Chat with the maintenance team (replies are simulated)

## Tech

Plain HTML, CSS and JavaScript. No build step and no dependencies.

```
index.html   page structure and tab bar
styles.css   theme tokens (light and dark) and component styles
app.js       data, screens, navigation and form logic
```

## Run it locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy with GitHub Pages

1. Push this folder to a GitHub repo.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick `main` and `/ (root)`, then save.
4. The site will be live at `https://<your-username>.github.io/<repo-name>/`.

## Data

Orders, reports and chat messages are saved in the browser's `localStorage` under the key `handled-v1`, so they stay on that one device. The app starts with a few example orders. To reset, clear the site's data in your browser or run `localStorage.removeItem("handled-v1")` in the console.

A production version would need a backend (for example a REST API or Firebase/Supabase) so tenants, maintenance staff and property managers share the same data.

## Design

Based on the Handled Figma prototype. Colors are defined as CSS variables at the top of `styles.css`, with a dark theme that follows the system setting.
