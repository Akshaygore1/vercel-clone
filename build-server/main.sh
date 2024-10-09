#!/bin/bash

# Export the Git repo URL (no spaces around =)
export GIT_REPO_URL="$GIT_REPO_URL"

# Clone the Git repository using the environment variable
git clone "$GIT_REPO_URL" /home/app/output

# Execute the Node.js script
exec node /home/app/script.js