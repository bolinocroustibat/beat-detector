## Install the dependencies

```bash
npm install
```


## Run locally

```bash
npm run dev
```
...and click on the link to see the output in the browser.


## Build for production

Build for production without including the dev dependencies with:
```bash
npm run build --omit-dev
```
...it will create a production build in `./dist` folder.

You can then preview the production build with:
```bash
npm run preview
```


## Format and lint code with Biome

Lint AND format with:
```bash
npx @biomejs/biome check --apply .
```
