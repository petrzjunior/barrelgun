import {readFile} from 'fs/promises';
import {BarrelgunConfig, generate} from './generate';
import Path from 'path';

export interface BarrelgunShootOptions {
	config?: string;
}

const loadConfig = async (path: string): Promise<BarrelgunConfig> => {
	const absolutePath = Path.resolve(process.cwd(), path);
	console.log(`Reading config from ${absolutePath}`);
	const promise = await import(absolutePath);
	return promise.default;
};

export const shoot = async (options: BarrelgunShootOptions): Promise<void> => {
	const configFile = options.config ?? 'barrelgun.config.js';
	const config = await loadConfig(configFile);
	await generate(config);
};
