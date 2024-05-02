import { writeFile } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const storeMerkleRoot = (merkleRoot) => {
    const filePath = join(__dirname, '..', 'Root.txt');
    writeFile(filePath, merkleRoot, err => {
        if (err) {
            console.error('Error writing Merkle root to file:', err);
            return;
        }
        console.log('Merkle root successfully stored in:', filePath);
    });
};

// Example usage
const merkleRoot = 'abc12qsdqds3xyz';
storeMerkleRoot(merkleRoot);
