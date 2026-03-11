import { argv } from 'node:process';

const dynamic = async () => {
	try {
		const module = await import(`./plugins/${argv[2]}.js`);
		console.log(module.run());
	} catch {
		console.log('Plugin not found');
		process.exit(1);
	}
};

await dynamic();
