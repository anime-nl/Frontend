import {execFileSync} from 'node:child_process'
import {readFileSync} from 'node:fs'

// Claude Code passes the tool call as JSON on stdin
const {tool_input: toolInput} = JSON.parse(readFileSync(0, 'utf8'))

if (toolInput?.file_path) {
  execFileSync('bunx', ['prettier', '--write', '--ignore-unknown', toolInput.file_path], {stdio: 'inherit'})
}
