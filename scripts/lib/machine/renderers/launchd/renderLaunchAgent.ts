import type { ServiceDefinition } from '../../domains/services/types/ServiceDefinition'
import { escapeXml } from './escapeXml'
import { renderSchedule } from './renderSchedule'
import { toShellCommand } from './toShellCommand'

export const renderLaunchAgent = (service: ServiceDefinition): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
    '<dict>',
    '  <key>Label</key>',
    `  <string>${escapeXml(service.name)}</string>`,
    '  <key>ProgramArguments</key>',
    '  <array>',
    '    <string>/bin/zsh</string>',
    '    <string>-lc</string>',
    `    <string>${escapeXml(toShellCommand(service, '$HOME'))}</string>`,
    '  </array>',
    ...(service.schedule === undefined ? [] : renderSchedule(service.schedule)),
    ...(service.runAtLoad === true
      ? ['  <key>RunAtLoad</key>', '  <true/>']
      : []),
    ...(service.keepAlive === true
      ? ['  <key>KeepAlive</key>', '  <true/>']
      : []),
    '</dict>',
    '</plist>',
    '',
  ].join('\n')
