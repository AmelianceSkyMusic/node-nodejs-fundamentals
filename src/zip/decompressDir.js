import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { createBrotliDecompress } from 'node:zlib';

const rootPath = process.cwd();

const COMPRESSED_PATH = path.join(rootPath, 'workspace/compressed');
const DECOMPRESSED_PATH = path.join(rootPath, 'workspace/decompressed');
const ARCHIVE_PATH = path.join(COMPRESSED_PATH, 'archive.br');

async function checkIsFolderExists(path) {
	try {
		const stats = await stat(path);
		return stats.isDirectory();
	} catch {
		return false;
	}
}

export async function checkIsFileExists(path) {
	try {
		const stats = await stat(path);
		return stats.isFile();
	} catch {
		return false;
	}
}

const decompressDir = async () => {
	const isCompressedPathExists = await checkIsFolderExists(COMPRESSED_PATH);
	const isArchivePathExists = await checkIsFileExists(ARCHIVE_PATH);
	if (!isCompressedPathExists || !isArchivePathExists) throw new Error('FS operation failed');

	const isDecompressedDirExists = await checkIsFolderExists(DECOMPRESSED_PATH);
	if (!isDecompressedDirExists) {
		await mkdir(DECOMPRESSED_PATH, { recursive: true });
	}

	const input = createReadStream(ARCHIVE_PATH);
	const brotliDecompressStream = createBrotliDecompress();
	input.pipe(brotliDecompressStream);

	const rl = readline.createInterface({ input: brotliDecompressStream });

	let output;
	for await (const line of rl) {
		if (line.startsWith('::meta::') && line.endsWith('::')) {
			if (output) output.end();

			const file = line.replace('::meta::', '').replace('::', '');

			const pathToFile = path.join(DECOMPRESSED_PATH, file);

			const dirPath = path.dirname(pathToFile);
			await mkdir(dirPath, { recursive: true });

			output = createWriteStream(pathToFile);
		} else {
			if (output) output.write(`${line}\n`);
		}
	}

	if (output) output.end();
};

await decompressDir();
