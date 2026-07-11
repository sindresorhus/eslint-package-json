# no-orphan-script-hooks

📝 Disallow `pre`/`post` script hooks without a corresponding script.

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

npm runs `pre<name>` and `post<name>` scripts before and after `name`, respectively. Without the matching script, the hook cannot run as part of that command and is usually a stale script or a typo.

npm lifecycle scripts such as `prepare`, `prepack`, and `preversion` are exempt because npm runs them independently. `preenv`, `postenv`, `prerestart`, and `postrestart` are also exempt because npm supplies implicit `env` and `restart` scripts. The rule does not inspect the filesystem, so a `prestart` hook that relies on npm's implicit `server.js` start script must be exempted with `ignore`.

No fix is provided because a hook-like name may be an intentionally standalone command, and only the package author can decide whether to remove it, add its target script, or ignore it.

## Options

### `ignore`

Type: `Array<string | RegExp>`\
Default: `[]`

Regular expressions matching standalone script names to ignore. Strings are interpreted as regular expression source.

```js
'package-json/no-orphan-script-hooks': [
	'error',
	{
		ignore: [
			'^prettier$',
			/^preview(?::|$)/,
		],
	},
]
```

## Examples

```json
// ❌
{
	"scripts": {
		"prebuild": "npm run clean"
	}
}
```

```json
// ✅
{
	"scripts": {
		"prebuild": "npm run clean",
		"build": "tsc",
		"postbuild": "npm run check"
	}
}
```

With `{ignore: ['^prettier$']}`:

```json
// ✅
{
	"scripts": {
		"prettier": "prettier --check ."
	}
}
```
