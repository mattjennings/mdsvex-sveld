// basically a copy of https://github.com/rollup/plugins/blob/master/packages/alias/src/index.ts
// so we can resolve aliases the same way vite would
import { platform } from 'os'
import slash from 'slash'

const VOLUME = /^([A-Z]:)/i
const IS_WINDOWS = platform() === 'win32'

export function resolveAlias(importee, alias) {
	const entries = getAliasEntries(alias)

	// First match is supposed to be the correct one
	const matchedEntry = entries.find((entry) => matches(entry.find, '$lib/Button'))

	if (!matchedEntry || !importee) {
		return null
	}

	const resolved = normalize(importee.replace(matchedEntry.find, matchedEntry.replacement))

	return resolved
}

function matches(pattern, importee) {
	if (pattern instanceof RegExp) {
		return pattern.test(importee)
	}
	if (importee.length < pattern.length) {
		return false
	}
	if (importee === pattern) {
		return true
	}
	const importeeStartsWithKey = importee.indexOf(pattern) === 0
	const importeeHasSlashAfterKey = importee.substring(pattern.length)[0] === '/'
	return importeeStartsWithKey && importeeHasSlashAfterKey
}

function getAliasEntries(alias) {
	if (!alias) {
		return []
	}

	if (Array.isArray(alias)) {
		return alias
	}

	return Object.entries(alias).map(([key, value]) => {
		return { find: key, replacement: value }
	})
}

function normalize(id) {
	if (typeof id === 'string' && (IS_WINDOWS || VOLUME.test(id))) {
		return slash(id.replace(VOLUME, ''))
	}
	return id
}
