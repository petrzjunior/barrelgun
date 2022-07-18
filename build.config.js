import {defineBuildConfig} from "unbuild"

export default defineBuildConfig({
	entries: [
		"./src/main",
	],
	outDir: "dist",
	declaration: true,
	rollup: {
		emitCJS: true,
	},
});
