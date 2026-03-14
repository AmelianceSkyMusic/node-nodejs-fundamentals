import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

const rootPath = process.cwd();

const CHECKSUMS_PATH = path.join(rootPath, 'checksums.json');

export async function checkIsFileExists(path) {
	try {
		const stats = await stat(path);
		return stats.isFile();
	} catch {
		return false;
	}
}

const calculateHash = async (filePath) => {
	const hash = createHash('sha256');

	const input = createReadStream(filePath);

	await pipeline(input, hash);
	return hash.digest('hex');
};

const verify = async () => {
	const isChecksumsPathExists = await checkIsFileExists(CHECKSUMS_PATH);
	if (!isChecksumsPathExists) throw new Error('FS operation failed');

	const fileData = await readFile(CHECKSUMS_PATH, { encoding: 'utf8' });
	const checksums = JSON.parse(fileData);

	for (const file of Object.keys(checksums)) {
		const hash = await calculateHash(file);
		console.log(`${file} — ${checksums[file] === hash ? 'OK' : 'FAIL'}`);
	}
};

await verify();
