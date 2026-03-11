import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const rootPath = process.cwd();

const WORKSPACE_RESTORED_PATH = path.join(rootPath, 'workspace_restored');
const FILE_PATH = path.join(rootPath, 'snapshot.json');

export async function checkIsFileExists(path) {
	try {
		const stats = await stat(path);
		return stats.isFile();
	} catch {
		return false;
	}
}

const checkIsFolderExists = async (path) => {
	try {
		const stats = await stat(path);
		return stats.isDirectory();
	} catch {
		return false;
	}
};

const restore = async () => {
	const isSnapshotPathExists = await checkIsFileExists(FILE_PATH);
	const isWorkspaceRestoredPathExists = await checkIsFolderExists(WORKSPACE_RESTORED_PATH);
	if (!isSnapshotPathExists || isWorkspaceRestoredPathExists) {
		throw new Error('FS operation failed');
	}

	const fileData = await readFile(FILE_PATH, { encoding: 'utf8' });
	const snapshot = JSON.parse(fileData);

	for (const entry of snapshot.entries) {
		const entryPath = path.join(WORKSPACE_RESTORED_PATH, entry.path);
		if (entry.type === 'file') {
			try {
				await writeFile(entryPath, entry.content, { encoding: 'base64' });
			} catch {
				const dirPath = path.dirname(entryPath);
				await mkdir(dirPath, { recursive: true });
				await writeFile(entryPath, entry.content, { encoding: 'base64' });
			}
		} else if (entry.type === 'directory') {
			await mkdir(entryPath, { recursive: true });
		}
	}
};

await restore();
