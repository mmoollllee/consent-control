export const defaults = {
   cookieName: 'consentcontrol',

   // Element containing main structure
   parentEl: null,

   template: {
      strings: {
         mainTitle: 'Cookies & Dienste',
         mainDescription: `Diese Webseite nutzt Cookies und externe Dienste.<br /><a
         href="/datenschutz/">Datenschutzbestimmungen</a> <a href="/impressum/">Impressum</a>`,
         settingsButtonLabel: 'Weitere Informationen',
         resetButtonLabel: 'Alle Cookies löschen',
         resetMessage: 'Alle Cookies wurden erfolgreich gelöscht.',
         closeButtonLabel: 'Schließen',
         okButtonLabel: 'OK',
         allButtonLabel: 'Alle erlauben',
      },

      // Main container element. Needs #consent-control-banner
      main: function () {
         return `<div id="consent-control-banner" class="is-collapsed" aria-modal="true" aria-hidden="true" aria-label="{mainTitle}">
         </div>`.replace(
            /{\w+}/g,
            (x) => this.strings[x.substring(1, x.length - 1)] || x
         )
      },

      headerEl: 'header',
      // Header default markup needs to have a button.consent-control--open
      header: function () {
         return `<h3>{mainTitle}</h3>
         <p>{mainDescription}</p>
         <button class="collapsed-only consent-control--open">{settingsButtonLabel}</button>`.replace(
            /{\w+}/g,
            (x) => this.strings[x.substring(1, x.length - 1)] || x
         )
      },

      switches: function () {
         return `<div class="switches"></div>`
      },
      switch: function (key, values) {
         return `<div class="form-check form-switch">
          <input id="consent-{key}" value="{key}" class="form-check-input" type="checkbox" role="switch">
          <label for="consent-{key}" class="form-check-label">{label}</label>
        </div>`
            .replace(
               /{\w+}/g,
               (x) => values[x.substring(1, x.length - 1)] || x
            )
            .replace(/{\w+}/g, (x) => (x == '{key}' ? key : x))
      },
      switchChild: function (child) {
         return `<li>
            <h4>{label}</h4>
          </li>`.replace(/{\w+}/g, (x) => child[x.substring(1, x.length - 1)] || x)
      },

      footer: function() {
         return `
         <div class="uncollapsed-only">
             <button class="consent-control--reset">{resetButtonLabel}</button>
         </div>
         <div class="control">
             <button class="secondary uncollapsed-only consent-control--close">{closeButtonLabel}</button>
             <button id="consent-control--submit">{okButtonLabel}</button>
             <button id="consent-control--submit-all">{allButtonLabel}</button>
         </div>`.replace(
            /{\w+}/g,
            (x) => this.strings[x.substring(1, x.length - 1)] || x
         )
      }
   },

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
                  'Lädt die Schriftart "Eurostile" von externen Servern von Adobe Fonts / Typekit',
            },
         ],
      },
      analytics: {
         label: 'Analytics',
         description:
            'Erlauben Sie dem Website-Betreiber, das Angebot auf dieser Webseite zu bewerten und zu verbessern.',
         childs: [
            {
               label: 'Google Tag Manager',
               description: `'UA-105811621-1, Cookie <strong>_ga</strong> Speicherdauer 2 Jahre`,
            },
         ],
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
      },
   },
}