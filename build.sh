#/bin/bash
#!/bin/bash

# Install package in development mode
pip install -e "."

# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite

# Server extension must be manually installed in develop mode
jupyter server extension enable jupyterWebCatConnect

# Rebuild extension Typescript source after making changes
jlpm build

# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch 

# # Run JupyterLab in the foreground
# jupyter lab
