import readline from 'node:readline';
import { EOL } from 'os';

const quotesRegExp = /"([^"]*)"|'([^']*)'|([^\s"']+)/g;
const quotesReplaceRegExp = /^["']|["']$/g;

const COMMAND = {
	uptime: 'uptime',
	cwd: 'cwd',
	date: 'date',
	exit: 'exit',
};

const colorLog = {
	error: (...arg) => console.error(`\x1b[31m${[...arg].join(' ')}\x1b[0m`),
	green: (...arg) => console.log(`\x1b[32m${[...arg].join(' ')}\x1b[0m`),
	yellow: (...arg) => console.log(`\x1b[1;33m${[...arg].join(' ')}\x1b[0m`),
	blue: (...arg) => console.log(`\x1b[3;34m${[...arg].join(' ')}\x1b[0m`),
};

function parseInputLine(line) {
	const preparedLine = line.trim();
	if (!preparedLine) return { command: null, args: [], argsLine: '' };

	const firstSpaceIndex = preparedLine.indexOf(' ');
	if (firstSpaceIndex === -1) return { command: preparedLine, args: [], argsLine: '' };

	const command = preparedLine.slice(0, firstSpaceIndex);
	const argsLine = preparedLine.slice(firstSpaceIndex).trim();

	const matches = argsLine.match(quotesRegExp);

	const args = matches?.map((arg) => arg.replace(quotesReplaceRegExp, '')) || [];

	return { command: command.trim(), args, argsLine };
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function doCommand(command) {
	return {
		[COMMAND.uptime]: () => colorLog.green(`Uptime: ${process.uptime().toFixed(2)}s`),
		[COMMAND.date]: () => colorLog.green(new Date().toISOString()),
		[COMMAND.cwd]: () => colorLog.blue(process.cwd()),
		[COMMAND.exit]: () => rl.close(),
	}[command]();
}

const interactive = () => {
	rl.on('SIGINT', () => rl.close());

	rl.on('close', () => {
		(colorLog.yellow(`${EOL}Goodbye!`), process.exit(0));
	});

	rl.setPrompt('> ');
	rl.prompt();

	rl.on('line', async (line) => {
		const { command } = parseInputLine(line);

		if (!command || !Object.values(COMMAND).includes(command)) {
			colorLog.error('Unknown command');
		} else {
			doCommand(command);
		}

		rl.prompt();
	});
};

interactive();
