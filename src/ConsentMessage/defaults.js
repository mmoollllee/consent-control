export const defaults = {
   
   template: {
      strings: {
         message: `Diese Inhalte werden extern geladen von <i class="consent-message--source">{srcName}</i>.<br />Durch das Aktivieren dieses Inhalts werden Daten wie Ihre IP-Adresse an den externen Server übertragen. Weitere Informationen entnehmen Sie bitte unserer <a href="/datenschutz/" title="Datenschutzerklärung lesen">Datenschutzerklärung</a>.`,
         buttonLabel: 'Inhalte laden',
      },

      main: `<div class="consent-message"><button class="button confirm">{buttonLabel}</button><p>{message}</p></div>`,
   }
}