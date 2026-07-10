# Consent Control

[![npm version](https://badge.fury.io/js/consent-control.svg)](https://badge.fury.io/js/consent-control)

Consent Control gives the website visitor full control before loading various assets, analytic tools or external services like Embedded Videos, Maps,...
Without too much distraction. And fully customizable.

Note: There are Browser Plugins like i-dont-care-about-cookies.eu that hide a consent banner like this.

[See demo](https://mmoollllee.github.io/consent-control/)

## Which package do I need?

`consent-control` is the framework-agnostic runtime (this package). For server-rendered
Laravel / Filament apps, install a wrapper instead — it vendors this runtime and adds Blade
components, config and translations, so you don't wire the JS yourself:

| Environment | Install |
|---|---|
| Plain HTML, WordPress, Vite, React, any JS | **`consent-control`** (this package) — see below |
| Laravel (Blade) | [`laravel-consent-control`](https://github.com/mmoollllee/laravel-consent-control) |
| Laravel + Filament | [`filament-consent-control`](https://github.com/mmoollllee/filament-consent-control) |

## Usage

### Install
`npm i consent-control`

### Include CSS & Javascript

```html
<!-- Obsolete if you use Bootstrap -->
<link href="dist/consentcontrol.bootstrap.css" rel="stylesheet" type="text/css" />
<!-- Main Stylsheet -->
<link href="dist/consentcontrol.main.css" rel="stylesheet" type="text/css" />

<script src="dist/bundle.min.js"></script>
```

```js
import { ConsentControl, loadScript } from "consent-control"
```

```scss
// Obsolete if you use Bootstrap
@import "~consent-control/dist/consentcontrol.bootstrap.css";
// Main Stylesheet
@import "~consent-control/dist/consentcontrol.main.css";
```

### Fire

```js
ConsentControl.init({
   switches: {
      necessary: {
         disabled: true,
         checked: true,
         label: 'Notwendige',
         description: 'Stellt die Funktionalität der Website sicher.',
         childs: [
            {
               label: 'Seiten-Einstellungen',
               description: `Speichert Ihre Einstellungen in diesem Banner, Cookie
            <strong>consentbanner</strong> Speicherdauer 1 Jahr`,
            },
            {
               label: 'Schriftarten',
               description:
                  'Lädt die Schriftart "XY" von externen Servern von Adobe Fonts / Typekit',
            },
         ],
         callback: function() {
            loadScript('https://use.typekit.net/xyz.js', () => {
               try {
                  Typekit.load({async: true});
               } catch (e) {}
            })
         }
      },
      analytics: {
         label: 'Analytics',
         description:
            'Erlauben Sie dem Website-Betreiber, das Angebot auf dieser Webseite zu bewerten und zu verbessern.',
         childs: [
            {
               label: 'Google Tag Manager',
               description: `'UA-123456789-1, Cookie <strong>_ga</strong> Speicherdauer 2 Jahre`,
            },
         ],
         callback: function() {
            var gtm = document.createElement('script');
            gtm.type = 'text/javascript';
            gtm.async = true;
            gtm.src = 'https://www.googletagmanager.com/gtag/js?id=UA-123456789-1';
            var s = document.getElementsByTagName('script')[0];
            s.parentNode.insertBefore(gtm, s);
            window.dataLayer = window.dataLayer || [];
         
            function gtag() {
            dataLayer.push(arguments);
            }
            gtag('js', new Date());
         
            gtag('config', 'UA-123456789-1');
         }
      },
      functional: {
         label: 'Funktionell',
         description: 'Funktionen für die Darstellung der Inhalte.',
         childs: [
            {
               label: 'Google Maps',
               description:
                  'Stellt eine Karte mit Routenbeschreibung zur Verfügung und lädt diese von externen Servern von Google.',
            },
         ],
         callback: function() {
            setupMap()
         }
      }
   }
})
```

### Reopen the banner

Visitors must be able to change their choice later (GDPR). Place a button with the
`consent-control--open` class anywhere — typically on the privacy policy page. The runtime
binds every such element on `init()` and reopens the banner with the settings expanded:

```html
<button type="button" class="consent-control--open">Cookie settings</button>
```

### Theming

The self-rendered banner reads CSS variables scoped to `#consent-control-banner`. The accent
**auto-adopts your site's primary colour** when it exposes one (Tailwind `--color-primary` or
Bootstrap `--bs-primary`); override any variable to brand it:

```css
#consent-control-banner {
   --cc-primary: #b91c1c;            /* accent: checked switches, links */
   --cc-on-primary: #fff;
   --cc-bg: #fff;                    /* banner surface */
   --cc-text: #1f2937;               /* body text */
   --cc-muted: #6b7280;              /* secondary text */
   --cc-border: rgba(0, 0, 0, .12);  /* dividers */
   --cc-section: rgba(0, 0, 0, .035);/* switches section background */
}
```

Buttons are deliberately left unstyled so they inherit your site's button styling — give them
your own classes via the `template.footer`/`template.rejectButton` options if needed.

### Optional: "Reject all" button

By default the **OK** button already saves only the pre-checked (minimal) selection, so it
acts as "reject all" as long as your default config leaves optional switches unchecked.
If you pre-check optional switches, you can enable an explicit, opt-in reject button:

```js
ConsentControl.init({
   rejectButton: true, // adds an "Alle ablehnen" button next to OK
   switches: { /* ... */ }
})
```

It saves only the locked `necessary` categories (`disabled: true`) and rejects everything
else. Customise the label via `template.strings.noneButtonLabel` and the markup via
`template.rejectButton`.

### Declarative services (config-driven)

Instead of a `callback` function you can declare services as data — ideal when the
config comes from a CMS / config file (PHP, WordPress, …) and cannot hold JS closures:

```js
ConsentControl.init({
   categories: {            // `switches` still works as an alias
      analytics: {
         label: 'Analytics',
         scripts: [
            { src: 'https://www.googletagmanager.com/gtag/js?id=G-XXXX', async: true },
         ],
         inlineScript: "window.dataLayer = window.dataLayer || []; /* … */",
      },
   },
})
```

`scripts` are injected once on consent (deduplicated by `src`); `inlineScript` runs once
inside a `try/catch`. `callback` keeps working and can be combined with both.

### Server-rendered markup (Laravel, WordPress, any framework)

`ConsentControl.init()` binds to an existing `#consent-control-banner` if present, so you
can render the banner server-side and let the runtime only wire behaviour (no client
re-render, no flash). Provide these selectors:

| Selector | Role |
|---|---|
| `#consent-control-banner` | Container. Start with classes `hide is-collapsed` so it stays hidden when a cookie already exists. |
| `.switches` › `input[value="{key}"]` | One checkbox per category (`disabled`/`checked` as needed). |
| `#consent-control--submit` | Save selected ("OK"). |
| `#consent-control--submit-all` | Allow all. |
| `#consent-control--submit-none` | Reject all (optional, opt-in). |
| `.consent-control--open` / `--close` / `--reset` | Reopen / collapse / delete all cookies. |
| `.collapsed-only` / `.uncollapsed-only` | Visibility helpers. |

When the markup already exists, the matching `template.*` strings are ignored for those
parts. The same applies to `ConsentMessage` (`.consent-message--wrapper`, `iframe[data-src]`,
`button.confirm`).

### Consent updated event

Whenever the consent state is applied, a `consent-updated` event is dispatched on `window`:

```js
window.addEventListener('consent-updated', (e) => {
   console.log('granted:', e.detail.consents) // e.g. ['necessary','analytics']
})
```

### Consent versioning

Force a fresh opt-in when your categories or privacy policy change by setting a `version`.
When the version stored in the cookie differs, existing consent is cleared and the banner
re-appears:

```js
ConsentControl.init({
   version: 2,        // bump whenever consent must be renewed
   categories: { /* … */ },
})
```

A companion cookie `{cookieName}-v` tracks the granted version. Leave `version` unset
(default) to disable versioning.

### Block your own `<script>` tags

Mark any script as consent-gated with `type="text/plain"` + `data-consent`. It stays inert
until the matching category is granted, then it is activated automatically (works for
external and inline scripts):

```html
<script type="text/plain" data-consent="analytics"
        src="https://www.googletagmanager.com/gtag/js?id=G-XXXX"></script>

<script type="text/plain" data-consent="analytics">
   window.dataLayer = window.dataLayer || [];
   gtag('config', 'G-XXXX');
</script>
```

### Check for consent
```js
import { getConsentControlCookie } from "consent-control"

   if (getConsentControlCookie('functional')) {
      setupMap()
   }
```

### Show Consent Message for iframes
```js
   const iframes = document.querySelectorAll('iframe[data-src][data-src-name="Vimeo"]')
   
   iframes.forEach((e) => {
      ConsentMessage.new(
         'functional',
         e,
         {
            template: {
               main: `<div class="consent-message"><button class="confirm play-button"></button><p>{message}</p></div>`,
            },
         }
      )
   })
```

You might also use it with Laravel & AlpineJS:
```blade
   <div 
      class="flex items-center mt-5 rounded-md consent-message--wrapper"
      x-init="
         $nextTick(() => { 
            window.ConsentMessage.new(
               'functional',
               $el
               )
         })
      "
   >
      <div class="max-w-lg rounded-lg consent-message scale">
         <button class="confirm">
            @svg('play', 'text-primary w-12 h-12 my-3 transition duration-300 hover:scale-125')
         </button>
         <p>Dieses Video wird von <i class="consent-message--source">www.youtube-nocookie.com</i> geladen.<br>Durch das Abspielen werden Daten wie z.B. Ihre IP-Adresse an den externen Server übertragen. Weitere Informationen entnehmen Sie bitte unserer <a href="{{ route('datenschutz')}} " wire:navigate title="Datenschutzerklärung lesen">Datenschutzerklärung</a>.</p>
      </div>
      <iframe 
         width="560"
         class="w-full"
         height="315"
         data-src="https://www.youtube-nocookie.com/embed/_bgy53RBCSk?si=-W9-4ZiJpC-iq0rI"
         title="YouTube video player"
         frameborder="0"
         allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen 
      ></iframe>
   </div>
```
