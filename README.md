# Discord Rich Presence

[![Release Build](https://github.com/LokiLeiche/Loki_DRP/actions/workflows/release.yml/badge.svg)](https://github.com/LokiLeiche/Loki_DRP/actions/workflows/release.yml)
[![Build](https://github.com/LokiLeiche/Loki_DRP/actions/workflows/build.yml/badge.svg)](https://github.com/LokiLeiche/Loki_DRP/actions/workflows/build.yml)

This is a simple VSCode extension that updates your discord rich presence (activity) based on what you are doing in VSCode

![preview image](preview.png)

## Features
* Show the current file you are editing
* Display an icon depending on the file type you are editing
* Show the workspace you opened
* Configure certain workspaces to be hidden

## Install instructions
Download the .vsix file from the [latest release](https://github.com/LokiLeiche/Loki_DRP/releases/latest). Now open VSCode, go to extensions, click the three dots at the top and press "Install from VSIX...", you'll get an explorer window where you have to select the downloaded .vsix file and that's it.

## Notes
This extension is highly personalized towards my needs and was not designed with the general public in mind.
If you still wish to use this extension as is, feel free to do so. Otherwise feel free to change the code to your needs and compile your own version.

## Build instructions
If you'd like to build this extension yourself from source, follow these instructions:
1. Clone the source code: `git clone https://github.com/LokiLeiche/Loki_DRP.git`
2. Go to the cloned directory: `cd Loki_DRP`
3. Install NPM packages: `npm install`
4. Compile everything: `npm run package`
5. Install VSCE npm package: `npm install -g @vscode/vsce`
6. Build the VSIX file: `vsce package`
7. Install the extension from the newly generated .vsix file like mentioned in the install instructions
When building you'll get a warning that electron was not found as dependency, since we use IPC to connect to discord you can savely ignore that.
