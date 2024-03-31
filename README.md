# Consent Control

[![npm version](https://badge.fury.io/js/consent-control.svg)](https://badge.fury.io/js/consent-control)

Consent Control gives the website visitor full control before loading various assets, analytic tools or external services like Embedded Videos, Maps,...
Without too much distraction. And fully customizable.

Note: There are Browser Plugins like i-dont-care-about-cookies.eu that hide a consent banner like this.

[See demo](https://mmoollllee.github.io/consent-control/)

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
ConsentControl({
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
