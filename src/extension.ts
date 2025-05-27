import * as vscode from 'vscode';
import { Client } from 'discord-rpc';
import { version } from 'os';

const CLIENT_ID = '1376721860800020523'; // discord app id
const START_TIME: number = Date.now(); // define start time here to not reset time whenever file changes

var rpc: Client | null = null;


export async function activate(_context?: vscode.ExtensionContext) {
    versionCheck();
    rpc = new Client({ transport: 'ipc' }); // initialize client

    rpc.on('ready', () => {
        setDiscordActivity(); // set initial activity when ready
    });

    rpc.on('disconnected', () => {
        vscode.window.showInformationMessage('Discord RPC disconnected. Activity status may not be updated.');
    });

    // connect rpc to discord
    try {
        await rpc.login({ clientId: CLIENT_ID });
    } catch (error) {
        console.error('Failed to connect to Discord RPC:', error);
        vscode.window.showErrorMessage(
            `Failed to connect to Discord. Ensure Discord is running and you are logged in. Error: ${error instanceof Error ? error.message : String(error)}`
        );
        // cleanup and try again after 30 seconds
        if (rpc) {
            rpc.destroy();
            rpc = null;

            setTimeout(function() {
                activate();
            }, 30000)
            return;
        }
    }


    // event listeners to update activity when file or config changes or something
    vscode.window.onDidChangeActiveTextEditor(setDiscordActivity);
    vscode.workspace.onDidOpenTextDocument(setDiscordActivity);
    vscode.workspace.onDidCloseTextDocument(setDiscordActivity);
    vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('loki-drp.secretWorkspaces') || event.affectsConfiguration('loki-drp.useVSCodeLogo')) {
            setDiscordActivity();
        }
    });
}

async function versionCheck() {
    const config = vscode.workspace.getConfiguration("loki-drp");
    if (!config.get("versionCheck")) return;
    setTimeout(async function() {
        const extension = vscode.extensions.getExtension("LokiScripts.loki-drp");
        if (!extension) return;
        const version = extension.packageJSON.version;

        try {
            const response = await fetch("https://api.github.com/repos/LokiLeiche/Loki_DRP/releases/latest", {
                headers: {
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });
            if (!response.ok) return;
            const data: any = await response.json();
            const latest_version = data.tag_name.substring(1);
            
            if (version != latest_version) {
                vscode.window.showInformationMessage(
                    `A new version for your discord rich presence extension is available! New version: ${latest_version} Your version: ${version}`,
                    'Update Now',
                    'Later',
                    "Don't remind again"
                ).then(selection => {
                    if (selection === 'Update Now') {
                        const uri = vscode.Uri.parse("https://github.com/LokiLeiche/Loki_DRP/releases/latest");
                        vscode.env.openExternal(uri);
                    } else if (selection === "Don't remind again") {
                        const config = vscode.workspace.getConfiguration("loki-drp");
                        config.update("versionCheck", false, vscode.ConfigurationTarget.Global);
                    }
                });
            }
        }
        catch (err) {
            console.error(err);
        }
    }, 1000)
}


/**
 * Updates the current activity
*/
function setDiscordActivity() {
    if (!rpc) {
        console.warn('Discord RPC client is not initialized yet');
        return;
    }

    let label_workspace: string | undefined = undefined; // stays undefined when no workspace is open to just not show, otherwise changed to label
    let details: string = 'Idling'; // Idling as default, change to editing filename when editor is open
    let smallImageKey: string | undefined = 'logo'; // take logo as default, allow undefined to remove in case large image is logo
	let extension: string = "logo"; // get file extension and use that icon as large image

    const config = vscode.workspace.getConfiguration('loki-drp');
    const secretWorkspaces: string[] = config.get('secretWorkspaces') || []; // load hidden workspaces that should not be shown in activity
    if (config.get('useVSCodeLogo')) {
        smallImageKey = "logo_vsc";
        extension = "logo_vsc"
    }

    let workspaceName: string | undefined = vscode.workspace.name;
    if (workspaceName && secretWorkspaces.includes(workspaceName)) workspaceName = "Secret";

    if (vscode.window.activeTextEditor) {
        let fileName: string | undefined = vscode.window.activeTextEditor.document.fileName.split('/').pop()?.split('\\').pop(); // only get the file name
		if (fileName) {
			const dotIdx = fileName.lastIndexOf('.');
			if (!(dotIdx === -1 || dotIdx === fileName.length - 1)) extension = fileName.slice(dotIdx + 1);
		}

        details = `Editing ${fileName || 'an untitled file'}`;
    }

    if (typeof workspaceName == "string") { // remove the [SSH: IP] after workspace name for remote connections to avoid leaking IP and keeping it clean
        let remoteIdx = workspaceName.indexOf("[SSH: ")
        if (remoteIdx > 0) workspaceName = workspaceName.slice(0, remoteIdx - 1)
        label_workspace = `Workspace: ${workspaceName || 'No Folder Open'}`;
    } 

	if (extension == "logo" || extension == "logo_vsc") { // undefine the small image which is logo in case big image is logo to avoid double logo
		smallImageKey = undefined;
	} else extension = extension.toLowerCase(); // lowercase to have both .TS and .ts show as typescript logo

    try {
        // first try setting large image to extension, I uploaded a bunch of common programming languages logos to the bots assets
        // with the file extension in lowercase as naming scheme. In case it's not found, it will error out and the catch
        // block serves as fallback to use the default logo as large image
		try {
			rpc.setActivity({
				details: details,
				state: label_workspace,

				startTimestamp: START_TIME,

				largeImageKey: extension,
				largeImageText: details,

				smallImageKey: smallImageKey,

				instance: false,
        	});
		}
		catch (err) {
			// fallback for error, should happen in case extension does not exist as asset
			rpc.setActivity({
				details: details,
				state: label_workspace,

				startTimestamp: START_TIME,

				largeImageKey: smallImageKey,
				largeImageText: details,

				instance: false,
        	});
		}
    } catch (error) {
        console.error('Failed to set Discord activity:', error);
    }
}


export function deactivate() {
    if (rpc) {
        rpc.destroy();
        rpc = null;
    }
}
