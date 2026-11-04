# Microsoft Club GIKI — "The Clock Tower Never Sleeps"

> Official website for **Microsoft Club GIKI** (Ghulam Ishaq Khan Institute, Topi, Pakistan; Microsoft Learn Student Ambassadors club) at [https://mlsaclubgiki.tech](https://mlsaclubgiki.tech).

---

## Architecture & Tech Stack

- **Framework**: [Astro v5](https://astro.build) (SSG / static output) + TypeScript
- **Motion & Choreography**: GSAP + ScrollTrigger (Milestones 3–7), Lenis smooth scroll
- **Rendering**: Canvas 2D for tile grid, layered SVG for landmarks & skyline
- **Styling**: Vanilla CSS with custom properties (`tokens.css`), fluid typography using `clamp()`, no bloated UI framework
- **Typography**: Self-hosted variable WOFF2 fonts (`Bricolage Grotesque`, `Instrument Sans`, `JetBrains Mono`)
- **Data Collections**: Static JSON in `src/content/`
- **SEO & Structured Data**: Static HTML output, Schema.org JSON-LD (`Organization`, `Event`, `PodcastEpisode`, `BlogPosting`), `sitemap.xml`, `robots.txt`

---

## Project Structure

```
├── public/
│   ├── assets/             # Supplied landmark illustrations and branding
│   │   ├── academic-block.png
│   │   ├── clock-tower.png
│   │   ├── skyline-panorama.png
│   │   └── logo.png
│   ├── fonts/              # Self-hosted WOFF2 font files
│   ├── favicon.svg         # Microsoft 4-square vector favicon
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── components/         # Modular Astro UI components
│   │   ├── Nav.astro       # Fixed minimal header with live clock & mobile drawer
│   │   ├── Hero.astro      # Hero scene (Milestone 2 canvas & SVG target)
│   │   ├── About.astro     # Who we are + 4 pillar cards
│   │   ├── Projects.astro  # University projects with tech tags & contributors
│   │   ├── Events.astro    # Flagship hackathon (Micathon), past & upcoming sessions
│   │   ├── Podcast.astro   # Logikal podcast episodes & archive
│   │   ├── Team.astro      # Executive committee & alumni
│   │   ├── Blog.astro      # Technical student blog
│   │   ├── Join.astro      # Batch induction status & social links
│   │   ├── Footer.astro    # Social links & copyright
│   │   └── SEO.astro       # Reusable meta tags, OG, Twitter card & JSON-LD
│   ├── content/            # Seed data schemas
│   │   ├── events.json
│   │   ├── projects.json
│   │   ├── episodes.json
│   │   ├── members.json
│   │   ├── posts.json
│   │   └── inductions.json
│   ├── layouts/
│   │   ├── BaseLayout.astro    # Root layout with font preloading & schema
│   │   └── DetailLayout.astro  # Layout for individual item detail pages
│   ├── pages/
│   │   ├── index.astro             # Single-page cinematic world
│   │   ├── admin.astro             # Admin panel stub
│   │   ├── events/[slug].astro     # Dynamic static event pages
│   │   ├── podcast/[slug].astro    # Dynamic static episode pages
│   │   ├── projects/[slug].astro   # Dynamic static project pages
│   │   └── blog/[slug].astro       # Dynamic static blog post pages
│   └── styles/
│       ├── tokens.css      # Design tokens (colors, fluid type, spacing, z-index)
│       ├── reset.css       # Clean modern CSS reset
│       ├── typography.css  # Font face declarations & type scale
│       └── global.css      # Layout grid & core utility classes
```

---

## Data Schemas (`src/content/`)

### `events.json`
- `slug` (`string`): Unique URL segment
- `title` (`string`): Event title
- `date` (`string | null`): ISO date `YYYY-MM-DD` or `null` if TBD
- `summary` (`string`): Short description
- `poster` (`string | null`): Path to poster image or `null` if needed
- `links` (`{ label: string, url: string }[]`): External registration / recap links
- `status` (`"featured" | "past" | "upcoming"`): Display state
- `tags` (`string[]`): Search & category tags

### `projects.json`
- `slug` (`string`): Unique URL segment
- `title` (`string`): Project name
- `summary` (`string`): Purpose and university impact
- `stack` (`string[]`): Technologies and frameworks used
- `contributors` (`string[]`): Student authors
- `links` (`{ demo?: string | null, github?: string | null }`): Repository / demo links
- `thumbnail` (`string | null`): Screenshot or preview asset

### `episodes.json` (Logikal)
- `ep` (`number`): Episode number
- `slug` (`string`): Unique URL segment
- `title` (`string`): Episode title
- `guest` (`string | null`): Featured guest name
- `date` (`string | null`): Air date
- `youtubeId` (`string | null`): YouTube video ID for embedded player
- `summary` (`string`): Episode summary

### `members.json`
- `ec` (`{ name: string, role: string, photo: string | null, linkedin: string | null }[]`): Current Executive Committee
- `alumni` (`array`): Graduated leads and mentors

### `inductions.json`
- `open` (`boolean`): Whether registrations are accepting applicants
- `deadline` (`string | null`): Closing date
- `applyUrl` (`string | null`): Form submission URL
- `note` (`string`): Display note when closed

---

## Development

```bash
# Start background dev server
astro dev --background

# Manage background server
astro dev status
astro dev logs
astro dev stop

# Production build
npm run build
```

## Manual Vercel deployment

This project is a static Astro site and does not require a GitHub Actions workflow
or a Vercel configuration file.

1. Push the repository to GitHub (or make sure the latest changes are already there).
2. Sign in to [Vercel](https://vercel.com) and select **Add New Project**.
3. Import the `hammad-tayyab/mlsa-web` repository and authorize access if prompted.
4. Keep the detected framework as **Astro**. Confirm these settings:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Install command:** `npm install`
5. Select **Deploy** and wait for the build to finish.
6. Open the generated `.vercel.app` URL to verify the site.
7. To use `mlsaclubgiki.tech`, open the project’s **Settings → Domains**, add the
   domain, and follow Vercel’s DNS instructions at your domain registrar.

Future pushes to the connected repository can still create Vercel deployments,
but GitHub Actions is no longer involved. To deploy without connecting GitHub,
use **Deploy → Upload** in Vercel or run `npx vercel` locally after installing
the Vercel CLI.
