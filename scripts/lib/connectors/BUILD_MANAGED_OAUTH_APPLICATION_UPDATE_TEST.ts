import assert from 'node:assert/strict'
import test from 'node:test'
import { buildManagedOAuthApplicationUpdate } from './buildManagedOAuthApplicationUpdate'

void test('managed OAuth updates preserve writable application configuration', () => {
  const application = {
    id: 'application-id',
    uid: 'application-uid',
    aud: 'application-audience',
    created_at: '2026-08-18T00:00:00Z',
    updated_at: '2026-08-18T01:00:00Z',
    name: 'OpenSEO',
    domain: 'seo.example.com',
    type: 'self_hosted',
    policies: [{ id: 'policy-id' }],
    oauth_configuration: {
      enabled: false,
      custom_property: 'preserved',
      dynamic_client_registration: {
        enabled: false,
        allow_any_on_localhost: false,
        allow_any_on_loopback: false,
        custom_registration_property: 'preserved',
      },
    },
  }

  const update = buildManagedOAuthApplicationUpdate(application)

  assert.equal('id' in update, false)
  assert.equal('uid' in update, false)
  assert.equal('aud' in update, false)
  assert.equal('created_at' in update, false)
  assert.equal('updated_at' in update, false)
  assert.equal(update['name'], 'OpenSEO')
  assert.deepEqual(update['policies'], [{ id: 'policy-id' }])
  assert.deepEqual(update['oauth_configuration'], {
    enabled: true,
    custom_property: 'preserved',
    dynamic_client_registration: {
      enabled: true,
      allow_any_on_localhost: true,
      allow_any_on_loopback: true,
      custom_registration_property: 'preserved',
    },
  })
  assert.equal(application.oauth_configuration.enabled, false)
})

void test('managed OAuth updates create configuration when the application has none', () => {
  const update = buildManagedOAuthApplicationUpdate({
    name: 'OpenSEO',
    domain: 'seo.example.com',
    type: 'self_hosted',
  })

  assert.deepEqual(update['oauth_configuration'], {
    enabled: true,
    dynamic_client_registration: {
      enabled: true,
      allow_any_on_localhost: true,
      allow_any_on_loopback: true,
    },
  })
})
