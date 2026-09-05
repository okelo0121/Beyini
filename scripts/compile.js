import fs from 'fs';
import path from 'path';
import solc from 'solc';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Compiling Beyini contracts for Monad...');

const sources = {
  'interfaces/IERC20.sol': {
    content: fs.readFileSync(path.join(rootDir, 'contracts/interfaces/IERC20.sol'), 'utf8'),
  },
  'libraries/BeyiniTypes.sol': {
    content: fs.readFileSync(path.join(rootDir, 'contracts/libraries/BeyiniTypes.sol'), 'utf8'),
  },
  'interfaces/IBeyiniEscrow.sol': {
    content: fs.readFileSync(path.join(rootDir, 'contracts/interfaces/IBeyiniEscrow.sol'), 'utf8'),
  },
  'core/BeyiniEscrow.sol': {
    content: fs.readFileSync(path.join(rootDir, 'contracts/core/BeyiniEscrow.sol'), 'utf8'),
  },
};

const input = {
  language: 'Solidity',
  sources,
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object'],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

let hasErrors = false;
if (output.errors) {
  output.errors.forEach((err) => {
    if (err.severity === 'error') {
      hasErrors = true;
      console.error(err.formattedMessage);
    } else {
      console.warn(err.formattedMessage);
    }
  });
}

if (hasErrors) {
  console.error('Compilation failed with errors.');
  process.exit(1);
}

const artifactsDir = path.join(rootDir, 'src/blockchain/artifacts');
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

const escrowContract = output.contracts['core/BeyiniEscrow.sol']['BeyiniEscrow'];
const escrowArtifact = {
  contractName: 'BeyiniEscrow',
  abi: escrowContract.abi,
  bytecode: escrowContract.evm.bytecode.object,
};

fs.writeFileSync(
  path.join(artifactsDir, 'BeyiniEscrow.json'),
  JSON.stringify(escrowArtifact, null, 2)
);

console.log('Compilation successful! Artifacts written to src/blockchain/artifacts/BeyiniEscrow.json');
