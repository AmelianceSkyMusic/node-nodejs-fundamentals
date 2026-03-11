import { stdin, stdout } from 'node:process';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

let index = 0;

const transformStream = new Transform({
	transform(chunk, encoding, callback) {
		const text = String(chunk);

		const transformedText = Array.from(text.split('\n'))
			.map((line) => {
				index++;
				return `${index} | ${line}`;
			})
			.join('\n');
		this.push(transformedText);

		callback();
	},
});

const lineNumberer = () => {
	pipeline(stdin, transformStream, stdout);
};

lineNumberer();
