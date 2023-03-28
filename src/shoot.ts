import {BarrelgunConfig, generate} from './generate.js';
import Path from 'path';
import {pathToFileURL} from 'url';

export interface BarrelgunShootOptions {
	config?: string;
}

const loadConfig = async (path: string): Promise<BarrelgunConfig> => {
	// convert fo file URL for compatibility with Windows
	const absolutePath = pathToFileURL(Path.resolve(process.cwd(), path)).toString();
	console.log(`Reading config from ${absolutePath}`);
	const promise = await import(absolutePath);
	return promise.default;
};

export const shoot = async (options: BarrelgunShootOptions): Promise<void> => {
	const configFile = options.config ?? 'barrelgun.config.js';
	const config = await loadConfig(configFile);
	await generate(config);
};
