import { main } from '../main'
import { validatePortableSkills } from './validatePortableSkills'

if (import.meta.url === `file://${String(process.argv[1])}`) {
  main()
    .then(validatePortableSkills)
    .then((ok) => {
      if (!ok) process.exit(1)
    })
    .catch(console.error)
}
