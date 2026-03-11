import { argv } from 'node:process';

const ARG_PREFIX = '--';
const ARG_PREFIX_REPLACEMENT = '';
const PROGRESS_FILLED_INDICATOR = '█';
const PROGRESS_EMPTY_INDICATOR = ' ';
const PROGRESS_LENGTH = 30;
const START_PROGRESS = 0;
const END_PROGRESS = 100;
const DURATION = 5000;
const UPDATE_INTERVAL = 100;

const REG_HEX = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

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

function getStartColor(hex) {
	if (!REG_HEX.test(hex)) return null;
	hex = hex.slice(1);
	if (hex.length === 3) {
		hex = hex
			.split('')
			.map((char) => char + char)
			.join('');
	}
	const r = parseInt(hex.slice(0, 2), 16);
	const g = parseInt(hex.slice(2, 4), 16);
	const b = parseInt(hex.slice(4, 6), 16);
	return `\x1b[38;2;${r};${g};${b}m`;
}

function mark(string, hexColor) {
	if (!hexColor) return string;
	const startColor = getStartColor(hexColor);
	if (!startColor) return string;
	return `${startColor}${string}${'\x1b[0m'}`;
}

const progress = () => {
	const args = parseArgs();
	const progressDuration = Number(args.duration) || DURATION;
	const updateInterval = Number(args.interval) || UPDATE_INTERVAL;
	const progressLength = Number(args.length) || PROGRESS_LENGTH;
	const progressIntervalMs = progressDuration / END_PROGRESS;
	const color = args.color || null;

	let progress = START_PROGRESS;
	let prevUpdateTime = 0;

	const interval = setInterval(() => {
		const uptimeInMs = Math.round(process.uptime().toFixed(4) * 1000);
		const updateDifference = uptimeInMs - prevUpdateTime;
		const shouldUpdate = updateDifference >= progressIntervalMs;
		if (!shouldUpdate) return;

		progress = progress + Math.round(updateDifference / progressIntervalMs);

		prevUpdateTime = uptimeInMs;

		const filledLength = Math.round((progressLength / END_PROGRESS) * progress);
		const filledProgressLine = new Array(filledLength).fill(PROGRESS_FILLED_INDICATOR).join('');

		const emptyProgressLineLength =
			progressLength - filledLength < START_PROGRESS
				? START_PROGRESS
				: progressLength - filledLength;

		const emptyProgressLine = new Array(emptyProgressLineLength)
			.fill(PROGRESS_EMPTY_INDICATOR)
			.join('');

		const progressPercentage = progress > END_PROGRESS ? END_PROGRESS : progress;
		process.stdout.write(
			`\r[${mark(filledProgressLine, color)}${emptyProgressLine}] ${progressPercentage}%`,
		);
		if (progress > END_PROGRESS) {
			clearInterval(interval);
			process.stdout.write('\nDone!\n');
		}
	}, updateInterval);
};

progress();
