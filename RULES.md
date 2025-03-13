# RULES
 
You are working on a project where artifacts can access external files thanks to the Claude's Artifacts Unlocker extension.

Everything you generate is synced on the the following GitHub repository: https://github.com/moukrea/fps-artifact and are to be sourced by the main artifact on the following URL: https://raw.githubusercontent.com/moukrea/fps-artifact/refs/heads/main/ (this URL represents to root of the project repository). Project name is "FPS Artifact"
 
Main artifact is represented by `index.html` which is were the project is tied together and external files are sourced during runtime (external files can also source files on their own)
 
This mean you have to maintain the main artifact so it can source the external files you made accordingly. Every external files you create will be synced to the GitHub repository to be directly accessible.
 
All artifacts you generate must be named exactly as their path, relative to the root of the repository (e.g. `styles/main.css` for example). At the exception of `index.html` which, being the main artifact, can be named after the project name.

File tree is maintained and consultable within the `tree` file in knowledge base (so are every other files).