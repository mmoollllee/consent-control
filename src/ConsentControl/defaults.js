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
      main: `<div id="consent-control-banner" class="is-collapsed" aria-modal="true" aria-hidden="true" aria-label="{mainTitle}">
         </div>`,

      headerEl: 'header',
      // Header default markup needs to have a button.consent-control--open
      header: `<h3>{mainTitle}</h3>
         <p>{mainDescription}</p>
         <button class="collapsed-only consent-control--open">{settingsButtonLabel}</button>`,

      switches: `<div class="switches"></div>`,
      switch: `<div class="form-check form-switch">
          <input id="consent-{key}" value="{key}" class="form-check-input" type="checkbox" role="switch">
          <label for="consent-{key}" class="form-check-label">{label}</label>
        </div>`,
      switchChild: `<li>
            <h4>{label}</h4>
          </li>`,

      footer: `
         <div class="uncollapsed-only">
             <button class="consent-control--reset">{resetButtonLabel}</button>
         </div>
         <div class="control">
             <button class="secondary uncollapsed-only consent-control--close">{closeButtonLabel}</button>
             <button id="consent-control--submit">{okButtonLabel}</button>
             <button id="consent-control--submit-all">{allButtonLabel}</button>
         </div>`
   },

   switches: {},
}