import path from "path";
import node_fetch from "node-fetch";
import fse from "fs-extra";
import global_agent from "global-agent";

export const download = async (url, folder) => {
	const parseContentDisposition = /filename="?([^"]+)"?/;

	return new Promise(async (resolve) => {
		try {
			console.log("Downloading from", url);
			const response = await node_fetch(url);
			const header = response.headers.get("Content-Disposition");
			const filename = header?.match(parseContentDisposition)?.[1];
			const fileLocation = path.join(folder, filename);
			console.log("Saving to", fileLocation);
			const arrayBuffer = await response.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);
			fse.ensureDirSync(folder);
			fse.createWriteStream(fileLocation).write(buffer, () => {
				console.log("Successfully downloaded");
				resolve({ data: fileLocation });
			});
		} catch (e) {
			resolve({ err: e.toString() });
		}
	});
};

const getEnv = (prefix = '') => {
    const envsLowerCase = {};
    for (const envKey in process.env) {
        envsLowerCase[envKey.toLowerCase()] = process.env[envKey];
    }
    return (name) => {
        return (envsLowerCase[`${prefix}${name}`.toLowerCase()] ||
            envsLowerCase[name.toLowerCase()] ||
            undefined);
    };
}

const setEnv = (key, value) => {
    if (value !== void 0) {
        process.env[key] = value;
    }
}

const initializeProxy = () => {
    try {
        // See: https://github.com/electron/get/pull/214#discussion_r798845713
        const env = getEnv('GLOBAL_AGENT_');
        setEnv('GLOBAL_AGENT_HTTP_PROXY', env('HTTP_PROXY'));
        setEnv('GLOBAL_AGENT_HTTPS_PROXY', env('HTTPS_PROXY'));
        setEnv('GLOBAL_AGENT_NO_PROXY', env('NO_PROXY'));
        global_agent.bootstrap();
    }
    catch (e) {
        d('Could not load either proxy modules, built-in proxy support not available:', e);
    }
}

initializeProxy();
download("https://install.interop.io/install/enterprise/citi-9.6/stable/9.6.0.1/ioConnectDesktopBundle.zip", process.cwd());