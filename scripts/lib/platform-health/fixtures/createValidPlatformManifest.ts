import { IDE_REGISTRY } from '../../link/constants/IDE_REGISTRY'

export const createValidPlatformManifest = () => ({
  version: 1,
  platforms: IDE_REGISTRY.map(({ id }) => ({
    registryId: id,
    capabilities: ['skills'],
    probe: { configPaths: [`$HOME/.${id}`] },
  })),
})
