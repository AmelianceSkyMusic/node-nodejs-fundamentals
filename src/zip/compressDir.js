import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { createBrotliCompress } from 'node:zlib';

const rootPath = process.cwd();

const TO_COMPRESS_PATH = path.join(rootPath, 'workspace/toCompress');
const ARCHIVE_PATH = path.join(rootPath, 'workspace/compressed/archive.br');

async function checkIsFolderExists(path) {
	try {
		const stats = await stat(path);
		return stats.isDirectory();
	} catch {
		return false;
	}
}

async function getPathFilesSnapshot(pathToSnapshot) {
	const pathDir = await readdir(pathToSnapshot, { recursive: true });

	const snapshot = [];

	for (const dir of pathDir) {
		const dirData = await stat(path.join(pathToSnapshot, dir));
		const dirPath = path.normalize(dir).replaceAll(path.sep, '/');
		if (dirData.isFile()) snapshot.push(dirPath);
	}

	return snapshot;
}

const compressDir = async () => {
	const isToCompressPathExists = await checkIsFolderExists(TO_COMPRESS_PATH);
	if (!isToCompressPathExists) throw new Error('FS operation failed');

	const archiveDir = path.dirname(ARCHIVE_PATH);
	const isArchiveDirExists = await checkIsFolderExists(archiveDir);
	if (!isArchiveDirExists) {
		await mkdir(archiveDir, { recursive: true });
	}

	const output = createWriteStream(ARCHIVE_PATH);
	const brotliCompressStream = createBrotliCompress();
	brotliCompressStream.pipe(output);

	const files = await getPathFilesSnapshot(TO_COMPRESS_PATH);

	for (const file of files) {
		const filePath = path.join(TO_COMPRESS_PATH, file);

		await new Promise((resolve, reject) => {
			brotliCompressStream.write(`::meta::${file}::\n`, (err) =>
				err ? reject(err) : resolve(),
			);
		});

		await new Promise((resolve, reject) => {
			const input = createReadStream(filePath);
			input.on('data', (chunk) => brotliCompressStream.write(chunk));
			input.on('end', resolve);
			input.on('error', reject);
		});
	}

	brotliCompressStream.end();
};

await compressDir();
