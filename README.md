[Chrome Plugin](https://chromewebstore.google.com/detail/part-db-page-submitter/bckkfkpidiiibmjdhjakleoagjmepioi) | [Firefox Plugin](https://addons.mozilla.org/de/firefox/addon/part-db-page-submitter/)

# Part-DB Browser Plugin

A browser extension for Chrome and Firefox that lets you submit any product page to [Part-DB](https://github.com/Part-DB/Part-DB-server) with one click. Part-DB then extracts part information from the page HTML (JSON-LD, OpenGraph, meta tags) and pre-fills the part creation form — no copy-pasting required.

## How it works

1. Browse to any product page (distributor, manufacturer datasheet, etc.)
2. Click the Part-DB toolbar button
3. The extension sends the page HTML and URL to your Part-DB instance
4. Part-DB opens the pre-filled "Create Part" form in a new tab

The extension sends the already-loaded page HTML, so Part-DB never needs to fetch the page itself — meaning it works even behind logins, CAPTCHAs, or bot-blocking sites.

## Requirements

- Part-DB server v2.12+ with browser plugin support enabled
- Chrome 109+ or Firefox 109+

## Installation

### From browser extension store (recommended)

The extension is available in the Chrome Web Store and Firefox Add-ons store. Just search for "Part-DB Browser Plugin" or click the links below:

* [Chrome Web Store](https://chromewebstore.google.com/detail/part-db-page-submitter/bckkfkpidiiibmjdhjakleoagjmepioi)
* [Firefox Addons-Store](https://addons.mozilla.org/de/firefox/addon/part-db-page-submitter/)

### Install unsigned version from this repository

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

> For firefox the plugin is only temporary loaded and will be removed when you restart the browser.

### From source

```bash
git clone https://github.com/Part-DB/part-db-browser-plugin.git
cd part-db-browser-plugin
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

| Permission | Type | Reason |
|------------|------|--------|
| `storage` | Required | Saves your Part-DB URL and locale setting |
| `activeTab` | Required | Reads the page HTML on demand when you click Submit |
| `scripting` | Required | Executes the page-reading code in the active tab |
| Host access to your Part-DB URL | Optional — granted when you save your server URL | Required to reach your Part-DB instance; scoped to exactly the URL you configure |

No host permissions are requested at install time. The extension has no passive presence on web pages — it reads page content only at the moment you click Submit.

## Building

The extension is plain JavaScript with no build step. PNG icons can be generated from the SVG source:

```bash
# or
bash generate_icons.sh      # requires inkscape, rsvg-convert, or imagemagick
```

The GitHub Actions CI packages the extension as a zip on every push and for every release tag (`v*`).

## Contributing

Bug reports and pull requests are welcome. Please open an issue first for significant changes.

## License

GNU Affero General Public License v3.0 — see [LICENSE](LICENSE).
