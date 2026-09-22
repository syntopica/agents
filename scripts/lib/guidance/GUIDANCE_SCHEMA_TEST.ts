import assert from 'node:assert/strict'
import test from 'node:test'
import outputSchema from '../../schemas/guidance-reconciliation.schema.json'

void test('the reconciliation output schema is strict at every object boundary', () => {
  const visit = (value: unknown, path: string): void => {
    if (Array.isArray(value)) {
      for (const [index, item] of value.entries())
        visit(item, `${path}[${String(index)}]`)
      return
    }
    if (typeof value !== 'object' || value === null) return
    const schemaNode = value as Record<string, unknown>
    if ('const' in schemaNode || 'enum' in schemaNode) {
      assert.equal(
        typeof schemaNode['type'],
        'string',
        `${path} must declare an explicit type`,
      )
    }
    if (schemaNode['type'] === 'object') {
      assert.equal(
        schemaNode['additionalProperties'],
        false,
        `${path} must reject extra properties`,
      )
      assert.equal(
        typeof schemaNode['properties'],
        'object',
        `${path} must declare properties`,
      )
      assert.notEqual(
        schemaNode['properties'],
        null,
        `${path} must declare properties`,
      )
      assert.deepEqual(
        [...((schemaNode['required'] as string[] | undefined) ?? [])].sort(
          (left, right) => left.localeCompare(right),
        ),
        Object.keys(schemaNode['properties'] as Record<string, unknown>).sort(
          (left, right) => left.localeCompare(right),
        ),
        `${path} must require every declared property`,
      )
    }
    for (const [key, child] of Object.entries(schemaNode))
      visit(child, `${path}.${key}`)
  }

  visit(outputSchema, '$schema')
})
