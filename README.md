# Part-DB Browser Plugin

A browser extension for Chrome and Firefox that lets you submit any product page to [Part-DB](https://github.com/Part-DB/Part-DB-server) with one click. Part-DB then extracts part information from the page HTML (JSON-LD, OpenGraph, meta tags) and pre-fills the part creation form — no copy-pasting required.

## How it works

1. Browse to any product page (distributor, manufacturer datasheet, etc.)
2. Click the Part-DB toolbar button
3. The extension sends the page HTML and URL to your Part-DB instance
4. Part-DB opens the pre-filled "Create Part" form in a new tab

The extension sends the already-loaded page HTML, so Part-DB never needs to fetch the page itself — meaning it works even behind logins, CAPTCHAs, or bot-blocking sites.

## Requirements

- Part-DB **v1.x** with the browser plugin backend (available from the `browser_plugin` branch / a future release)
- Chrome 109+ or Firefox 109+

## Installation

### From a release (recommended)

1. Download `partdb-browser-plugin.zip` from the [latest release](../../releases/latest)
2. Extract the zip

**Chrome / Chromium / Edge:**
- Open `chrome://extensions`
- Enable *Developer mode* (top-right toggle)
- Click *Load unpacked* and select the extracted folder

**Firefox:**
- Open `about:debugging#/runtime/this-firefox`
- Click *Load Temporary Add-on*
- Select `manifest.json` inside the extracted folder

> For persistent installation in Firefox, the extension needs to be signed via [AMO](https://addons.mozilla.org/).

### From source

```bash
git clone https://github.com/Part-DB/part-db-browser-plugin.git
cd part-db-browser-plugin
python3 src/icons/generate.py   # generates PNG icons
```

Then load the `src/` directory as an unpacked extension (see above).

## Configuration

After installing, click the extension icon and then **Open Settings** (or right-click the icon → *Options*):

| Setting | Description |
|---------|-------------|
| **Part-DB base URL** | Root URL of your Part-DB instance, e.g. `https://partdb.example.com` |
| **Interface locale** | Language code used in Part-DB URLs, e.g. `en`, `de`, `fr`. Check your browser's address bar when using Part-DB. |

Use the **Test Connection** button to verify the URL is reachable and you are logged in.

## Permissions

| Permission | Reason |
|------------|--------|
| `storage` | Saves your Part-DB URL and locale setting |
| `tabs` | Queries the active tab to read its URL; opens the Part-DB form in a new tab |
| `activeTab` | Allows messaging the content script on the active page |
| `host_permissions: <all_urls>` | Required to POST page HTML to your Part-DB instance with session cookies (cross-origin fetch with credentials) |

## Building

The extension is plain JavaScript with no build step. PNG icons are generated from the SVG source:

```bash
python3 src/icons/generate.py   # requires only Python 3 stdlib
# or
bash src/icons/generate.sh      # requires inkscape, rsvg-convert, or imagemagick
```

The GitHub Actions CI generates icons and packages the extension as a zip on every push and for every release tag (`v*`).

## Contributing

Bug reports and pull requests are welcome. Please open an issue first for significant changes.

## License

GNU Affero General Public License v3.0 — see [LICENSE](LICENSE).
