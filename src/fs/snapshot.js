import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path, { join } from 'node:path';

const rootPath = process.cwd();

const WORKSPACE_PATH = join(rootPath, 'workspace');
const FILE_PATH = join(rootPath, 'snapshot.json');

const checkIsFolderExists = async (path) => {
	try {
		const stats = await stat(path);
		return stats.isDirectory();
	} catch {
		return false;
	}
};

const snapshot = async () => {
	const isWorkspacePathExists = await checkIsFolderExists(WORKSPACE_PATH);
	if (!isWorkspacePathExists) throw new Error('FS operation failed');

	const entries = await Promise.all(
		(await readdir(WORKSPACE_PATH, { recursive: true })).map(async (file) => {
			const dirData = await stat(join(WORKSPACE_PATH, file));
			return dirData.isFile()
				? {
						path: path.normalize(file).replaceAll(path.sep, '/'),
						type: 'file',
						size: dirData.size,
						content: await readFile(join(WORKSPACE_PATH, file), { encoding: 'base64' }),
					}
				: {
						path: path.normalize(file).replaceAll(path.sep, '/'),
						type: 'directory',
					};
		}),
	);
	const snapshot = JSON.stringify(
		{ rootPath: path.normalize(WORKSPACE_PATH).replaceAll(path.sep, '/'), entries },
		null,
		3,
	);
	await writeFile(FILE_PATH, snapshot);
};

await snapshot();
