/**
 * Download the Electron binary if npm skipped the package install script
 * (allowScripts / ignore-scripts). electron-vite throws "Electron uninstall"
 * when path.txt / dist are missing.
 */
import { existsSync } from 'fs'
import { spawnSync } from 'child_process'
import { join } from 'path'

const installJs = join('node_modules', 'electron', 'install.js')
const pathFile = join('node_modules', 'electron', 'path.txt')
if (!existsSync(installJs)) process.exit(0)
if (existsSync(pathFile)) process.exit(0)

console.log('Electron binary missing; running node_modules/electron/install.js')
const result = spawnSync(process.execPath, [installJs], { stdio: 'inherit' })
process.exit(result.status ?? 1)
