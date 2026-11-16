import { test } from 'node:test'
import assert from 'node:assert/strict'
import { page, countSrcWrites, categories, REOPEN } from './helpers.mjs'

const IFRAMES = '<iframe id="f1" data-src="https://video.example.net/1"></iframe>'
   + '<iframe id="f2" data-src="https://video.example.net/2"></iframe>'

test('a resolved message does not break later saves', async (t) => {
   const p = await page(t, { body: REOPEN + IFRAMES })
   p.ConsentMessage.new('functional', p.$('#f1'))
   p.ConsentMessage.new('functional', p.$('#f2'))
   p.ConsentControl.init({ categories })

   p.click('#consent-control--submit-all')
   p.click('#reopen')
   p.click('#consent-control--submit')
   p.click('#reopen')
   p.click('#consent-control--submit')

   assert.deepEqual(p.errors, [])
   assert.equal(p.events.length, 3)
   assert.equal(p.$('#f1').getAttribute('src'), 'https://video.example.net/1')
   assert.equal(p.$('#f2').getAttribute('src'), 'https://video.example.net/2')
   assert.equal(p.ConsentMessage.callbacks.functional.length, 0)
})

test('a message confirmed on its own does not break a later save', async (t) => {
   const p = await page(t, { body: REOPEN + IFRAMES })
   const f1Writes = countSrcWrites(p.$('#f1'))
   p.ConsentMessage.new('functional', p.$('#f1'))
   p.ConsentMessage.new('functional', p.$('#f2'))
   p.ConsentControl.init({ categories })

   p.$('#f1').parentNode.querySelector('button.confirm').click()
   assert.equal(p.$('#f1').getAttribute('src'), 'https://video.example.net/1')
   assert.equal(p.$('#f2').hasAttribute('src'), false, 'loads only the confirmed one')

   p.setSwitch('functional', true)
   p.click('#consent-control--submit')
   p.click('#reopen')
   p.click('#consent-control--submit')

   assert.deepEqual(p.errors, [])
   assert.equal(p.events.length, 2)
   assert.equal(p.$('#f2').getAttribute('src'), 'https://video.example.net/2')
   assert.equal(f1Writes.length, 1)
   assert.equal(p.ConsentMessage.callbacks.functional.length, 0)
})

test('a wrapper element with an iframe inside loads its iframe once', async (t) => {
   const p = await page(t, { body: REOPEN + '<div id="box"><iframe data-src="https://video.example.net/box"></iframe></div>' })
   const writes = countSrcWrites(p.$('#box iframe'))
   p.ConsentMessage.new('functional', p.$('#box'))
   p.ConsentControl.init({ categories })

   p.click('#consent-control--submit-all')
   p.click('#reopen')
   p.click('#consent-control--submit')
   p.click('#reopen')
   p.click('#consent-control--submit')

   assert.deepEqual(p.errors, [])
   assert.equal(writes.length, 1, 'setting src again would reload the iframe')
   assert.equal(p.$('#box .consent-message'), null)
   assert.equal(p.ConsentMessage.callbacks.functional.length, 0)
})

test('template: false of one message does not apply to the next ones', async (t) => {
   const p = await page(t, {
      body: '<div id="map"><div class="consent-message"><button class="confirm">Load map</button></div></div>'
         + '<iframe id="video" data-src="https://video.example.net/v"></iframe>',
   })
   p.ConsentMessage.new('functional', p.$('#map'), { template: false }, null, () => {})
   p.ConsentMessage.new('functional', p.$('#video'))

   const wrapper = p.$('#video').parentNode
   assert.ok(wrapper.classList.contains('consent-message--wrapper'))
   assert.ok(wrapper.querySelector('.consent-message button.confirm'))
})

test('a custom template of one message does not apply to the next ones', async (t) => {
   const p = await page(t, { body: IFRAMES })
   p.ConsentMessage.new('functional', p.$('#f1'), {
      template: { main: '<div class="consent-message custom"><button class="confirm">Play</button></div>' },
   })
   p.ConsentMessage.new('functional', p.$('#f2'))

   assert.ok(p.$('#f1').parentNode.querySelector('.consent-message.custom'))
   assert.equal(p.$('#f2').parentNode.querySelector('.consent-message.custom'), null)
})

test('a confirm button that stays after loading ignores further clicks', async (t) => {
   const p = await page(t, {
      body: '<div id="box"><button class="confirm">Load</button><div class="consent-message">External content</div></div>',
   })
   let loads = 0
   p.ConsentMessage.new('functional', p.$('#box'), { template: false }, null, () => loads++)

   p.click('#box button.confirm')
   p.click('#box button.confirm')

   assert.deepEqual(p.errors, [])
   assert.equal(loads, 1)
})

test('a message without confirm button still loads with consent', async (t) => {
   const p = await page(t, { body: '<div id="box"></div>' })
   let loads = 0
   p.ConsentMessage.new('functional', p.$('#box'), { template: false }, null, () => loads++)
   p.ConsentControl.init({ categories })

   p.click('#consent-control--submit-all')

   assert.equal(loads, 1)
})

test('stored consent of an outdated version does not load content created before init()', async (t) => {
   const p = await page(t, {
      body: IFRAMES,
      cookies: { consentcontrol: 'necessary|functional', 'consentcontrol-v': '1' },
   })
   p.ConsentMessage.new('functional', p.$('#f1'))
   p.ConsentControl.init({ version: 2, categories })
   await p.tick()

   assert.equal(p.$('#f1').hasAttribute('src'), false)
   assert.ok(p.$('#f1').parentNode.querySelector('.consent-message'))
   assert.equal(p.consent(), false, 'outdated consent is cleared')
   assert.equal(p.$('#consent-control-banner').classList.contains('hide'), false)
})

test('stored consent of the current version loads content created before init() at once', async (t) => {
   const p = await page(t, {
      body: IFRAMES,
      cookies: { consentcontrol: 'necessary|functional', 'consentcontrol-v': '2' },
   })
   p.ConsentMessage.new('functional', p.$('#f1'))
   p.ConsentControl.init({ version: 2, categories })

   assert.equal(p.$('#f1').getAttribute('src'), 'https://video.example.net/1')
   assert.equal(p.$('#f1').parentNode, p.document.body, 'not wrapped')
   assert.equal(p.$('.consent-message'), null)
})

test('without ConsentControl.init() stored consent still loads the content', async (t) => {
   const p = await page(t, { body: IFRAMES, cookies: { consentcontrol: 'necessary|functional' } })
   p.ConsentMessage.new('functional', p.$('#f1'))
   await p.tick()

   assert.equal(p.$('#f1').getAttribute('src'), 'https://video.example.net/1')
   assert.equal(p.$('.consent-message'), null)
})

test('with consent given, new() after init() loads at once', async (t) => {
   const p = await page(t, { body: IFRAMES, cookies: { consentcontrol: 'necessary|functional' } })
   p.ConsentControl.init({ categories })
   p.ConsentMessage.new('functional', p.$('#f1'))

   assert.equal(p.$('#f1').getAttribute('src'), 'https://video.example.net/1')
   assert.equal(p.$('#f1').parentNode, p.document.body, 'not wrapped')
})

test('a later grant loads all open messages of the category', async (t) => {
   const p = await page(t, { body: REOPEN + IFRAMES })
   p.ConsentMessage.new('functional', p.$('#f1'))
   p.ConsentMessage.new('functional', p.$('#f2'))
   p.ConsentControl.init({ rejectButton: true, categories })

   p.click('#consent-control--submit-none')
   assert.equal(p.$('#f1').hasAttribute('src'), false)

   p.click('#reopen')
   p.setSwitch('functional', true)
   p.click('#consent-control--submit')

   assert.equal(p.$('#f1').getAttribute('src'), 'https://video.example.net/1')
   assert.equal(p.$('#f2').getAttribute('src'), 'https://video.example.net/2')
   assert.equal(p.reloads, 0, 'granting more is no withdrawal')
})

test('a failing message callback does not stop the other messages and services', async (t) => {
   const p = await page(t, { body: '<iframe id="broken" data-src="https://video.example.net/x"></iframe>' + IFRAMES })
   p.ConsentMessage.new('functional', p.$('#broken'), {}, null, () => {
      throw new Error('embed failed')
   })
   p.ConsentMessage.new('functional', p.$('#f1'))
   p.ConsentControl.init({ categories })

   p.click('#consent-control--submit-all')

   assert.deepEqual(p.errors, [])
   assert.equal(p.$('#f1').getAttribute('src'), 'https://video.example.net/1')
   assert.equal(p.events.length, 1)
   assert.match(p.logged.join('\n'), /embed failed/)
})
