import { spawn } from 'node:child_process';
import { stderr, stdout } from 'node:process';

const execCommand = () => {
	const commands = process.argv[2];
	const [command, ...args] = commands.split(' ');

	const cp = spawn(command, args, { env: process.env });

	cp.stdout.pipe(stdout);
	cp.stderr.pipe(stderr);

	cp.on('exit', (code) => {
		process.exit(code);
	});
};

execCommand();
