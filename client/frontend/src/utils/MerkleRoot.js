export async function computeMerkleRoot(hashes) {
    async function sha256(buffer) {
        const digest = await crypto.subtle.digest('SHA-256', buffer);
        return digest;
    }

    async function reduceHashes(hashes) {
        if (hashes.length === 1) return hashes[0];
        const reducedHashes = [];
        for (let i = 0; i < hashes.length; i += 2) {
            if (i + 1 < hashes.length) {
                const concatenatedBuffer = new Uint8Array(hashes[i].byteLength + hashes[i + 1].byteLength);
                concatenatedBuffer.set(new Uint8Array(hashes[i]), 0);
                concatenatedBuffer.set(new Uint8Array(hashes[i + 1]), hashes[i].byteLength);
                const newHash = await sha256(concatenatedBuffer);
                reducedHashes.push(newHash);
            } else {
                reducedHashes.push(hashes[i]);
            }
        }
        if (reducedHashes.length > 1) {
            return reduceHashes(reducedHashes);
        }
        return reducedHashes[0];
    }

    return reduceHashes(hashes);
}

// This function now expects an array of ArrayBuffers (hash buffers) directly from the file hashing process
// computeMerkleRoot([buffer1, buffer2, ...]).then(rootBuffer => {
//     // Convert the final root hash buffer to hex string if needed for display or storage
//     const hexRoot = Array.from(new Uint8Array(rootBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
//     console.log("Merkle Root in Hex:", hexRoot);
// });
