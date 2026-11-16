import { test } from 'node:test'
import assert from 'node:assert/strict'
import { page, categories, REOPEN } from './helpers.mjs'

test('a rejected pre-checked category stays off when the banner is reopened', async (t) => {
   const p = await page(t, { body: REOPEN, cookies: { consentcontrol: 'necessary' } })
   p.ConsentControl.init({
      categories: { ...categories, marketing: { label: 'Marketing', checked: true } },
   })

   p.click('#reopen')
   assert.equal(p.$('#consent-control-banner input[value="marketing"]').checked, false)
   assert.equal(p.$('#consent-control-banner input[value="necessary"]').checked, true)

   p.click('#consent-control--submit')
   assert.deepEqual(p.consent(), ['necessary'])
})

test('category keys that are no CSS identifiers work', async (t) => {
   const p = await page(t, {
      body: REOPEN + '<script type="text/plain" data-consent="3rd party">window.__runs = (window.__runs || 0) + 1</script>',
      cookies: { consentcontrol: 'necessary|3rd party' },
   })
   p.ConsentControl.init({ categories: { ...categories, '3rd party': { label: 'Third party' } } })
   p.click('#reopen')

   assert.deepEqual(p.errors, [])
   assert.equal(p.$('#consent-control-banner input[value="3rd party"]').checked, true)
   assert.equal(p.window.__runs, 1)
})

test('a service callback runs once per page, not on every save', async (t) => {
   let runs = 0
   const p = await page(t, { body: REOPEN })
   p.ConsentControl.init({
      categories: { ...categories, functional: { label: 'Functional', callback: () => runs++ } },
   })

   p.click('#consent-control--submit-all')
   p.click('#reopen')
   p.click('#consent-control--submit')
   p.click('#reopen')
   p.click('#consent-control--submit')

   assert.equal(runs, 1)
   assert.equal(p.events.length, 3)
})

test('a failing service callback does not stop later categories or the event', async (t) => {
   let runs = 0
   const p = await page(t)
   p.ConsentControl.init({
      categories: {
         necessary: { ...categories.necessary, callback: () => { throw new Error('font loader failed') } },
         functional: { label: 'Functional', callback: () => runs++ },
      },
   })

   p.click('#consent-control--submit-all')

   assert.deepEqual(p.errors, [])
   assert.equal(runs, 1)
   assert.equal(p.events.length, 1)
   assert.match(p.logged.join('\n'), /font loader failed/)
})

test('blocked scripts run once when their category is granted', async (t) => {
   const p = await page(t, {
      body: REOPEN + '<script type="text/plain" data-consent="functional">window.__runs = (window.__runs || 0) + 1</script>',
   })
   p.ConsentControl.init({ categories })
   assert.equal(p.window.__runs, undefined)

   p.click('#consent-control--submit-all')
   p.click('#reopen')
   p.click('#consent-control--submit')

   assert.equal(p.window.__runs, 1)
})

test('withdrawing a category reloads the page', async (t) => {
   const p = await page(t, { body: REOPEN, cookies: { consentcontrol: 'necessary|functional' } })
   p.ConsentControl.init({ categories })
   assert.equal(p.reloads, 0)

   p.click('#reopen')
   p.setSwitch('functional', false)
   p.click('#consent-control--submit')

   assert.equal(p.reloads, 1)
   assert.deepEqual(p.events.at(-1), { consents: ['necessary'], revoked: ['functional'] })
})

test('reloadOnRevoke: false leaves a withdrawal to the consent-updated event', async (t) => {
   const p = await page(t, { body: REOPEN })
   p.ConsentControl.init({ reloadOnRevoke: false, rejectButton: true, categories })

   p.click('#consent-control--submit-all')
   p.click('#reopen')
   p.click('#consent-control--submit-none')

   assert.equal(p.reloads, 0)
   assert.deepEqual(p.events.at(-1), { consents: ['necessary'], revoked: ['functional'] })
})

test('the reset button keeps keepOnReset cookies and storage keys, then reloads', async (t) => {
   const p = await page(t, {
      cookies: { session: 's1', cart_id: 'c1', _ga: 'g1' },
      storage: { cart_items: '[1]', tracker_id: 't1' },
   })
   p.ConsentControl.init({ keepOnReset: ['session', 'cart_*'], categories })

   p.click('.consent-control--reset')

   assert.deepEqual(p.cookieNames(), ['cart_id', 'session'])
   assert.equal(p.window.localStorage.getItem('cart_items'), '[1]')
   assert.equal(p.window.localStorage.getItem('tracker_id'), null)
   assert.equal(p.reloads, 1)
})

test('the reset button deletes all cookies and storage by default', async (t) => {
   const p = await page(t, {
      cookies: { session: 's1', _ga: 'g1' },
      storage: { cart_items: '[1]' },
   })
   p.ConsentControl.init({ categories })

   p.click('.consent-control--reset')

   assert.deepEqual(p.cookieNames(), [])
   assert.equal(p.window.localStorage.length, 0)
})

test('the banner is exposed while shown and inert while hidden', async (t) => {
   const p = await page(t, { body: REOPEN })
   p.ConsentControl.init({ categories })
   const banner = p.$('#consent-control-banner')

   assert.equal(banner.getAttribute('role'), 'dialog')
   assert.equal(banner.hasAttribute('aria-modal'), false, 'the page stays usable')
   assert.equal(banner.hasAttribute('aria-hidden'), false)
   assert.equal(banner.hasAttribute('inert'), false)

   p.click('#consent-control--submit')
   assert.equal(banner.getAttribute('aria-hidden'), 'true')
   assert.equal(banner.hasAttribute('inert'), true)

   p.click('#reopen')
   assert.equal(banner.hasAttribute('aria-hidden'), false)
   assert.equal(banner.hasAttribute('inert'), false)
   assert.equal(p.document.activeElement, banner)

   // opened without a focused element to return to (e.g. Safari doesn't focus clicked buttons)
   p.click('#consent-control--submit')
   assert.equal(p.document.activeElement, p.document.body, 'the focus does not stay in the hidden banner')
})

test('reopening moves the focus into the banner and saving moves it back', async (t) => {
   const p = await page(t, { body: REOPEN, cookies: { consentcontrol: 'necessary' } })
   p.ConsentControl.init({ categories })

   const reopen = p.$('#reopen')
   reopen.focus()
   reopen.click()
   const banner = p.$('#consent-control-banner')
   assert.equal(p.document.activeElement, banner)

   const ok = p.$('#consent-control--submit')
   ok.focus()
   ok.click()
   assert.equal(p.document.activeElement, reopen)
})

test('expanding and collapsing the settings keeps the focus in the banner', async (t) => {
   const p = await page(t)
   p.ConsentControl.init({ categories })
   const banner = p.$('#consent-control-banner')

   const settings = banner.querySelector('.consent-control--open')
   settings.focus()
   settings.click()
   assert.equal(banner.classList.contains('is-collapsed'), false)
   assert.equal(p.document.activeElement, banner)

   const close = banner.querySelector('.consent-control--close')
   close.focus()
   close.click()
   assert.equal(banner.classList.contains('is-collapsed'), true)
   assert.equal(p.document.activeElement, banner)
})

test('options of an earlier init() call do not stick', async (t) => {
   const p = await page(t)
   p.ConsentControl.init({ rejectButton: true, categories })
   p.ConsentControl.init({ categories })

   assert.equal(p.ConsentControl.options.rejectButton, false)
})
