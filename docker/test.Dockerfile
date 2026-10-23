# Runs the integration tests without a visible window, like CI does:
#   pnpm run test:docker
#   CONTAINER_ENGINE=podman pnpm run test:docker
FROM node:24-bookworm-slim

# xvfb provides a virtual display, the rest are libraries VS Code (Electron) needs
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    xvfb xauth ca-certificates \
    libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 libdrm2 libgbm1 libgtk-3-0 \
    libnss3 libsecret-1-0 libxcomposite1 libxdamage1 libxkbfile1 libxrandr2 libxss1 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# packageManager is a valid npm package spec, e.g. pnpm@12.15.0
RUN npm install -g "$(node -p 'require("./package.json").packageManager')" \
  && pnpm install --frozen-lockfile

COPY . .

CMD ["xvfb-run", "-a", "pnpm", "test"]
