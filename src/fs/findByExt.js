import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { argv } from 'node:process';

const rootPath = process.cwd();

const WORKSPACE_PATH = path.join(rootPath, 'workspace');
const ARG_PREFIX = '--';
const ARG_PREFIX_REPLACEMENT = '';

const utils = {
	checkIsFolderExists: async (path) => {
		try {
			const stats = await stat(path);
			return stats.isDirectory();
		} catch {
			return false;
		}
	},

	parseArgs: () => {
		let filteredArgs = {};

		for (let i = 0; i < argv.length; i++) {
			const argKey = argv[i];
			if (argKey.startsWith(ARG_PREFIX)) {
				const preparedArgKey = argKey.replace(ARG_PREFIX, ARG_PREFIX_REPLACEMENT);
				const argValue = argv[i + 1];
				filteredArgs[preparedArgKey] = argValue;
				i++;
			}
		}

		return filteredArgs;
	},
};

const findByExt = async () => {
	const isWorkspaceRestoredPathExists = await utils.checkIsFolderExists(WORKSPACE_PATH);
	if (!isWorkspaceRestoredPathExists) throw new Error('FS operation failed');

	const args = utils.parseArgs();
	if (!args.ext) args.ext = 'txt';
	const targetExt = args.ext.startsWith('.') ? args.ext : `.${args.ext}`;

	const workspaceDir = await readdir(WORKSPACE_PATH, { recursive: true });

	const entries = [];
	for (const dir of workspaceDir) {
		const dirData = await stat(path.join(WORKSPACE_PATH, dir));
		if (!dirData.isFile() || path.extname(dir) !== targetExt) continue;
		const dirPath = path.normalize(dir).replaceAll(path.sep, '/');
		entries.push(dirPath);
	}
	entries.sort();

	console.log(entries.join('\n'));
};

await findByExt();
