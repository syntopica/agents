import { main } from './main'

if (import.meta.url === `file://${String(process.argv[1])}`) {
  main().catch(console.error)
}
