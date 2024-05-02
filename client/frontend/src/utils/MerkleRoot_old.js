import crypto from 'crypto';


function sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

export function computeMerkleRoot(fileContents) {
    let hashes = fileContents.map(content => sha256(content));

    function reduceHashes(hashes) {
        if (hashes.length === 1) return hashes[0];
        const reducedHashes = [];
        for (let i = 0; i < hashes.length; i += 2) {
            if (i + 1 < hashes.length) {
                reducedHashes.push(sha256(hashes[i] + hashes[i + 1]));
            } else {
                reducedHashes.push(hashes[i]);
            }
        }
        return reduceHashes(reducedHashes);
    }

    return reduceHashes(hashes);

}

// const __dirname = dirname(fileURLToPath(import.meta.url)); // this can be added as an argument 
// const storeMerkleRoot = (merkleRoot) => {
//     const filePath = join(__dirname, '..', 'Root.txt');
//     writeFile(filePath, merkleRoot, err => {
//         if (err) {
//             console.error('Error writing Merkle root to file:', err);
//             return;
//         }
//         console.log('Merkle root successfully stored in:', filePath);
//     });
// };

// export function computeAndStoreMerkleRoot(fileContents){
//     let root=computeMerkleRoot(fileContents)
//     storeMerkleRoot(root)
// }

// computeAndStoreMerkleRoot(["eqsd","qsdq"])
