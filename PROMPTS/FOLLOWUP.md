You're continuing work on an existing project that uses Claude's Artifacts Unlocker extension. This project already has files synced to GitHub and accessible in the knowledge base. You'll be iterating on these existing files and potentially adding new ones.

## Current Project State

The current state of the project is documented in the knowledge base. Before proceeding:

1. Review the **file tree** to understand the project structure
2. Examine the **existing files** (especially index.html and main JavaScript files)
3. Understand the current implementation and architecture

## Project Continuation Guidelines

FOLLOW UP HERE

## Repository and File Rules

These rules MUST be followed exactly as in the original project:

- All artifacts you create/modify will be synced to the GitHub repository shown in the knowledge base
- External files are accessed at runtime from: `https://raw.githubusercontent.com/moukrea/fps-artifact/refs/heads/main/`
- The main artifact remains `index.html` and serves as the entry point
- **CRITICAL RULE**: All other artifacts must be named EXACTLY according to their path relative to the repository root (e.g., `js/main.js`, `css/styles.css`)
- When modifying an existing file, maintain its exact path and filename

## Modifying Files

When modifying existing files:

1. Pay special attention to the loading mechanism in `index.html`:
   - If adding new files, ensure they're added to the appropriate loading arrays
   - Maintain the correct loading order for dependencies
   - Keep the error handling and initialization patterns intact

2. For JavaScript files:
   - Maintain the existing namespacing pattern
   - Preserve the module structure (IIFE pattern)
   - Add new functionality without breaking existing features
   - Ensure proper export of public functions

3. For CSS and other assets:
   - Make changes that are consistent with the existing style
   - Avoid breaking existing layout or functionality

## Adding New Files

When adding new files:

1. Follow the existing project structure and naming conventions
2. Update any relevant loaders (in index.html or elsewhere) to include the new files
3. Ensure new JavaScript files follow the same namespacing pattern
4. Test for conflicts with existing files

## Approach to Implementation

For each request:

1. First analyze what needs to be changed or added
2. Identify which existing files need modification
3. Determine if new files are needed
4. Make the changes while maintaining consistency with the existing codebase
5. Ensure all file references are properly updated

## Testing Considerations

Before finalizing changes, consider:

- Will new files load correctly?
- Are dependencies loaded in the right order?
- Could changes break existing functionality?
- Are namespaces maintained consistently?
- Is error handling still robust?

Remember that all changes will be immediately available in the GitHub repository, so take care to make changes that work together coherently.
