import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const rootPath = process.cwd();

const WORKSPACE_PATH = path.join(rootPath, 'workspace');
const FILE_PATH = path.join(rootPath, 'snapshot.json');

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

	const workspaceDir = await readdir(WORKSPACE_PATH, { recursive: true });

	const entries = [];
	for (const dir of workspaceDir) {
		const dirData = await stat(path.join(WORKSPACE_PATH, dir));
		const dirPath = path.normalize(dir).replaceAll(path.sep, '/');
		const entry = dirData.isFile()
			? {
					path: dirPath,
					type: 'file',
					size: dirData.size,
					content: await readFile(path.join(WORKSPACE_PATH, dir), { encoding: 'base64' }),
				}
			: {
					path: dirPath,
					type: 'directory',
				};
		entries.push(entry);
	}

	const snapshotData = JSON.stringify(
		{ rootPath: path.normalize(WORKSPACE_PATH).replaceAll(path.sep, '/'), entries },
		null,
		3,
	);

	await writeFile(FILE_PATH, snapshotData);
};

await snapshot();
