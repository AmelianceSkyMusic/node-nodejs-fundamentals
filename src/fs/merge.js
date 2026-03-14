import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { argv } from 'node:process';

const rootPath = process.cwd();

const WORKSPACE_PATH = path.join(rootPath, 'workspace');
const PARTS_DIR_PATH = path.join(WORKSPACE_PATH, 'parts');
const MERGE_FILE_PATH = path.join(WORKSPACE_PATH, 'merged.txt');
const ARG_PREFIX = '--';
const ARG_PREFIX_REPLACEMENT = '';
const ARG_LIST_SEPARATOR = ',';

const utils = {
	checkIsFileExists: async (path) => {
		try {
			const stats = await stat(path);
			return stats.isFile();
		} catch {
			return false;
		}
	},

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
				filteredArgs[preparedArgKey] = argValue
					.split(ARG_LIST_SEPARATOR)
					.map((item) => item.trim());
				i++;
			}
		}

		return filteredArgs;
	},
};

const merge = async () => {
	const isPartDirExists = await utils.checkIsFolderExists(PARTS_DIR_PATH);
	const isWorkspaceRestoredPathExists = await utils.checkIsFolderExists(WORKSPACE_PATH);
	if (!isWorkspaceRestoredPathExists || !isPartDirExists) throw new Error('FS operation failed');

	const args = utils.parseArgs();

	const targetExt = '.txt';

	let entries = [];

	if (args.files) {
		for (const fileName of args.files) {
			const filePath = path.join(PARTS_DIR_PATH, fileName);
			const isFileExists = await utils.checkIsFileExists(filePath);
			if (!isFileExists) throw new Error('FS operation failed');
			entries.push(filePath);
		}
	} else {
		const partsDir = await readdir(PARTS_DIR_PATH, { recursive: true, withFileTypes: true });

		for (const partFile of partsDir) {
			if (!partFile.isFile() || path.extname(partFile.name) !== targetExt) continue;
			const filePath = path.join(partFile.parentPath, partFile.name);
			entries.push(filePath);
		}

		if (!entries.length) throw new Error('FS operation failed');

		entries.sort();
	}

	const writeContent = [];
	for (const entry of entries) {
		const content = await readFile(entry);
		writeContent.push(content);
	}

	await writeFile(MERGE_FILE_PATH, writeContent);
};

await merge();
