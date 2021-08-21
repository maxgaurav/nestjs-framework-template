#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { readFileSync, writeFileSync } = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { join } = require('path');

// Fix sequelize-cli doesnt support typescript extensions
// Will be run in the postinstall script in package.json
const pathHelperPath = join(
  __dirname,
  '../node_modules/sequelize-cli/lib/helpers/path-helper.js',
);
const pathHelperFileReplace = readFileSync(pathHelperPath, 'utf8').replace(
  "return 'js'",
  "return 'ts'",
);
writeFileSync(pathHelperPath, pathHelperFileReplace, 'utf8');

//Updating skeleton.js file with type cast information
const injectImportContent = `'use strict';

import { QueryInterface, Sequelize } from 'sequelize';`;

const attachTypeCastUp =
  'up: async (queryInterface: QueryInterface, Sequelize: Sequelize)';

const attachTypeCastDown =
  'down: async (queryInterface: QueryInterface, Sequelize: Sequelize)';

let skeletonPath = join(
  __dirname,
  '../node_modules/sequelize-cli/lib/assets/migrations/skeleton.js',
);
const skeletonImportInject = readFileSync(skeletonPath, 'utf8').replace(
  "'use strict';",
  injectImportContent,
);
writeFileSync(skeletonPath, skeletonImportInject, 'utf8');

skeletonPath = join(
  __dirname,
  '../node_modules/sequelize-cli/lib/assets/migrations/skeleton.js',
);
const skeletonInjectTypeCastUp = readFileSync(skeletonPath, 'utf8').replace(
  'up: async (queryInterface, Sequelize)',
  attachTypeCastUp,
);
writeFileSync(skeletonPath, skeletonInjectTypeCastUp, 'utf8');

skeletonPath = join(
  __dirname,
  '../node_modules/sequelize-cli/lib/assets/migrations/skeleton.js',
);
const skeletonInjectTypeCastDown = readFileSync(skeletonPath, 'utf8').replace(
  'down: async (queryInterface, Sequelize)',
  attachTypeCastDown,
);
writeFileSync(skeletonPath, skeletonInjectTypeCastDown, 'utf8');
