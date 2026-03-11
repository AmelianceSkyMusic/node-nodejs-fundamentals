import { createReadStream, createWriteStream } from 'node:fs';
import path from 'node:path';
import { argv } from 'node:process';
import readline from 'node:readline/promises';

const rootPath = process.cwd();

const SOURCE_PATH = path.join(rootPath, 'source.txt');
const ARG_PREFIX = '--';
const ARG_PREFIX_REPLACEMENT = '';

function parseArgs() {
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
}

const args = parseArgs();
const chunkSize = Number(args.lines) || 10;

let fileCount = 1;
let chunksCount = 0;

const split = async () => {
	const input = createReadStream(SOURCE_PATH);

	const rl = readline.createInterface({
		input,
		crlfDelay: Infinity,
	});

	let output;
	for await (const line of rl) {
		if (chunksCount % chunkSize === 0) {
			if (output) output.end();
			output = createWriteStream(path.join(rootPath, `chunk_${fileCount}.txt`));
			fileCount++;
		}
		if (output) output.write(line + '\n');

		chunksCount++;
	}

	if (output) output.end();
};

await split();
