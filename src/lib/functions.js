/**
 * Hide Privacy Controls on Privacy-Page.
 * Privacy Controls might look like this:
 * <h3>Data collection</h3>
 * <p>Click the following button to edit your settings and enable or disable different services we use for a better user experience</p>
 * <button href="#" title="Privacy Consent Settings" class="consent-control--open">Click to change settings.</button>
 */
export const hideConsentControlButtons = () => {
   const buttons = document.querySelectorAll(".consent-control--open")
   if (!buttons || buttons.length < 1) { return false}
   buttons.array.forEach(element => {
      element.style.display = "none"
   });
}