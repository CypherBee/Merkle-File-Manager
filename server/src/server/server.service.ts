import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { createHash } from 'crypto';
import * as path from 'path';
import { FilesService } from 'src/files/files.service';
import { v4 as uuidv4 } from 'uuid';
interface ExtendedFile extends Express.Multer.File {
  uuid: string;  // Make UUID a non-optional property if it will always be present
}
@Injectable()
export class ServerService {
  private uploadsDirectory: string = path.join(__dirname, '../../uploads'); // Adjust based on your directory structure
  constructor(private readonly filesService: FilesService) {}

  // MAIN FUNCTON TO UPLAOD FILES
  async handleFileUploads(files: ExtendedFile[]): Promise<any[]> {
    const uploadId: string = uuidv4(); // Generate a unique upload ID

    // Create a promise for each file upload
    const fileUploadPromises = files.map((file) => this.handleFileUpload(file));

    // Await all file upload promises to resolve
    const fileUploadResults = await Promise.all(fileUploadPromises);

    // Attach the upload ID to each result and prepare them for database insertion
    const responses = fileUploadResults.map((fileInfo) => ({
      ...fileInfo,
      uploadId,
    }));

    // Save all file info along with their upload ID to the database
    await this.filesService.createMultiple(responses);

    return responses;
  }

  // ----------------handleFile Uploads Helpers----------------

  async handleFileUpload(file: ExtendedFile): Promise<{
    id: string;
    filename: string;
    servername: string;
    size: number;
    hash: string;
  }> {
    const hash = this.generateFileHash(file.path);
    const fileInfo = {
      id: file.uuid,
      filename: file.originalname,
      servername: file.filename,
      size: file.size,
      hash: hash,
    };
    console.log('filename:', fileInfo.filename);
    return fileInfo;
  }

  // Utility function to generate hash from file
  private generateFileHash(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  // ------------------------------------------

  async getFile(filename: string): Promise<{ path: string; content: Buffer }> {
    try {
      const filePath = path.join(this.uploadsDirectory, filename);
      console.log('uploads drectory', this.uploadsDirectory);
      const content = fs.readFileSync(filePath);
      console.log('content');

      return { path: filePath, content };
    } catch (error) {
      // If the file does not exist or there is any other read error, throw a custom error
      throw new Error('File not found');
    }
  }

  async listFiles(): Promise<string[]> {
    try {
      const files = fs.readdirSync(this.uploadsDirectory);
      return files;
    } catch (error) {
      throw new Error('Unable to list files');
    }
  }

  //MAIN FUNCTION TO GET THE PROOF
  async getProof(id: string): Promise<{ isLeft: boolean; sibling: string }[]> {
    // Fetch the hash of the target file.
    const fileInfo = await this.filesService.findOne(id);
    if (!fileInfo || !fileInfo.hash) {
      throw new Error(`File with ID ${id} not found or hash not available.`);
    }
    const targetHash = fileInfo.hash;

    // Retrieve all hashes in the same upload
    const leafHashes = await this.findHashes(id);
    if (!leafHashes || leafHashes.length === 0) {
      throw new Error('No hashes found for the files in the same upload.');
    }

    // Generate the Merkle proof for the target hash.
    const proof = this.generateMerkleProof(targetHash, leafHashes);
    console.log('proof sent by the Server', proof);
    return proof;
  }
  // ---------------------Helper functions to get the Proof -------------
  private generateMerkleProof(
    targetHash: string,
    leafHashes: string[],
  ): { isLeft: boolean; sibling: string }[] {
    //console.log('generateMerkleProof: targetHash', targetHash);
    //console.log('generateMerkleProof: leafHashes', leafHashes);

    let level = leafHashes;
    let proof: { isLeft: boolean; sibling: string }[] = [];
    let index = level.indexOf(targetHash);

    if (index === -1) {
      console.error('Target hash not found in leaf hashes');
      return proof; // or throw an error depending on your error handling strategy
    }

    while (level.length > 1) {
      //console.log('generateMerkleProof: current level', level);
      //console.log('generateMerkleProof: current index', index);

      const newLevel: string[] = [];

      for (let i = 0; i < level.length; i += 2) {
        const combinedHash =
          i + 1 < level.length
            ? this.hashPair(level[i], level[i + 1])
            : level[i];
        newLevel.push(combinedHash);

        if (index === i || index === i + 1) {
          if (i + 1 < level.length) {
            // Ensure the sibling exists
            proof.push(
              index === i
                ? { isLeft: true, sibling: level[i + 1] }
                : { isLeft: false, sibling: level[i] },
            );
          }
          index = Math.floor(index / 2);
        }
      }

      level = newLevel;
      if (newLevel.length === 1) break; // This avoids an infinite loop if the top of the tree is reached
    }

    console.log("root",level[0])
    return proof;
  }

  // This function (hashPair) is assumed to be defined elsewhere and takes two hashes as input and returns their combined hash

  hashPair(left: string, right: string): string {
    // Assume hashPair uses a crypto library as before
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(left + right)
      .digest('hex');
  }
  private async findHashes(id: string): Promise<string[]> {
    // Fetch files that belong to the same upload based on the provided ID.
    const files = await this.filesService.filesInSameUpload(id);

    // Sort files by filename in a case-insensitive manner.
    files.sort((a, b) =>
      a.filename.localeCompare(b.filename, undefined, { sensitivity: 'base' }),
    );

    // Extract hashes from the sorted files.
    const leafHashes = files.map((file) => file.hash);

    //console.log('leafHashes', leafHashes);

    return leafHashes;
  }
}
// ------------------------ -------------
