import {Parcel} from "@parcel/core";
import Path from "path";
import {Worker} from "worker_threads";

const fileName = "src/main.ts";

console.log("Starting build of", fileName);

let worker = null;

const execute = (path, argv) => {
	if (worker) {
		console.log('🗡️ Killing running process');
		worker.terminate();
	}
	worker = new Worker(path);
	worker.on("online", () => {
		console.log("✈️ Launched");
	});
	worker.on("error", (err) => {
		console.log("💥 Process crashed", err);
	});
	worker.on("exit", (exitCode) => {
		console.log(`🚪 Proccess exited with code ${exitCode}`);
		worker = null;
	});
};

const bundler = new Parcel({
	entries: fileName,
	defaultConfig: "@parcel/config-default"
});

await bundler.watch((err, event) => {
	if (err) {
		console.log("💥 Error occured during build");
		throw err;
	}

	if (event.type === "buildSuccess") {
		const bundles = event.bundleGraph.getBundles();
		console.log(`✨ Built ${bundles.length} bundles in ${event.buildTime}ms! Changed ${event.changedAssets.size} aseets`);

		const expectedBundleName = fileName.split("/").pop().replace("ts", "js");
		const targetBundle = bundles.find(bundle => bundle.target.distEntry === expectedBundleName);
		if (!targetBundle) {
			throw new Error(`Did not find bundle matching ${expectedBundleName} for entry ${fileName}`);
		}

		const bundlePath = Path.join(targetBundle.target.distDir, targetBundle.target.distEntry);
		console.log(`🚀 Launching ${bundlePath}`);
		execute(bundlePath);
	} else if (event.type === "buildFailure") {
		console.log("🛑 Build failure");
		console.log(event.diagnostics);
	}
});
