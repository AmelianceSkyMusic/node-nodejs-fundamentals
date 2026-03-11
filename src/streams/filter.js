import { stat } from 'node:fs/promises';
import { argv, stdin, stdout } from 'node:process';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

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

const args = utils.parseArgs();
const pattern = args.pattern || '';

const transformStream = new Transform({
	transform(chunk, encoding, callback) {
		const text = String(chunk);

		const transformedText = text.split('\n');
		transformedText.forEach((line) => {
			if (line.includes(pattern)) {
				this.push(`${line}\n`);
			}
		});

		callback();
	},
});

const filter = () => {
	pipeline(stdin, transformStream, stdout);
};

filter();
