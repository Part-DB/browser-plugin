# Privacy Policy — Part-DB Browser Extension

**Last updated: 2026-05-15**

## Summary

This extension does not collect, store, or transmit any data to the extension developer or any third party. All network communication goes exclusively to the Part-DB server URL that you configure yourself.

As this plugin sends the full page HTML to your Part-DB server, it is recommended to only use it with trusted Part-DB instances that you control or that are operated by a trusted organization.
Also be sure that the current page does not contain any sensitive information that you would not want to share with the Part-DB server, as the extension does not filter or redact any content from the page HTML.

## Data stored locally in your browser

The extension stores the following data in your browser using the standard WebExtension storage APIs:

| Storage | Key | Contents |
|---|---|---|
| `storage.sync` | `partdbUrl` | The URL of your Part-DB server |
| `storage.sync` | `partdbLocale` | Your preferred Part-DB interface language |
| `storage.local` | `infoCache` | A short-lived cache (5 minutes) of the provider list fetched from your Part-DB server |
| `storage.local` | `lastProvider` | The last info-provider you selected in the popup |

`storage.sync` data is synced across your browser profile by your browser vendor (e.g., Google or Mozilla) if you have browser sync enabled. This is subject to your browser vendor's own privacy policy. The extension itself has no control over or visibility into this sync.

## Data transmitted when using the extension

When you click **Submit** in the popup, the extension reads the following data from the currently active tab and sends it to your configured Part-DB server:

- The full HTML source of the page
- The page URL
- The page title

The page is read only at the moment you click Submit — the extension has no passive presence on web pages and does not monitor browsing activity.

This data is sent via an authenticated HTTPS POST request to your own Part-DB server only. It is not sent to the extension developer, any analytics service, or any other third party.

The extension also makes a GET request to your Part-DB server to fetch the list of available info-providers (e.g., to populate the provider dropdown). This request includes your browser's session cookies for that server so that Part-DB can authenticate you.

## No third-party data sharing

The extension does not:

- Send any data to the extension developer
- Use analytics, crash reporting, or telemetry services
- Contact any server other than the Part-DB instance you configure
- Track your browsing history or behavior

## Permissions justification

| Permission | Type | Why it is needed |
|---|---|---|
| `storage` | Required | Save your server URL and locale preference |
| `activeTab` | Required | Read the page HTML on demand when you click Submit |
| `scripting` | Required | Execute the page-reading code in the active tab when you click Submit |
| Host access to your Part-DB URL | Optional — granted when you save your server URL | Allows the extension to make requests to your Part-DB server; scoped to exactly the URL you configure |

The extension requests no host permissions at install time. When you save your Part-DB server URL in the settings, the browser will ask you to grant access to that specific address only.

## Contact

If you have questions about this privacy policy, please open an issue at the project's source repository.
