import addFormats from 'ajv-formats'
import Ajv from 'ajv/dist/2020.js'
import schema from '../../../schemas/guidance-reconciliation.schema.json'

export const validateReconciliationSchema = (value: unknown): string[] => {
  const ajv = new Ajv({ allErrors: true, strict: true })
  addFormats(ajv)
  const validate = ajv.compile(schema)
  return validate(value)
    ? []
    : (validate.errors ?? []).map(
        (error) =>
          `${error.instancePath} ${error.message ?? 'schema validation failed'}`,
      )
}
