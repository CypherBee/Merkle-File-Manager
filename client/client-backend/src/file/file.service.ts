import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import Axios from 'axios';
import * as FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { promises as fsPromises } from 'fs';
import { v4 as uuidv4 } from 'uuid';

interface ExtendedFile extends Express.Multer.File {
  uuid: string; // Make UUID a non-optional property if it will always be present
}
@Injectable()
export class FileService {
  /**
   * Retrieves a file from the specified URL and returns its contents along with a proof and hash.
   *
   * @param {URL} url - The URL of the file to retrieve.
   * @return {Promise<{ proof: { isLeft: boolean; sibling: string }[], fileHash: string, fileBuffer: Buffer, filename: string }>} - A promise that resolves to an object containing the proof, hash, file buffer, and filename of the retrieved file.
   */
  async retrieveFile(url: URL): Promise<{
    proof: { isLeft: boolean; sibling: string }[];
    fileHash: string;
    fileBuffer: Buffer;
    filename: string;
    fileId: string;
  }> {
    try {
      // Make the HTTP request to retrieve the file
      const response = await axios({
        url: url.href,
        method: 'GET',
        responseType: 'json', // Ensures the response is treated as a binary blob
      });

      // Attempt to extract the filename from the Content-Disposition header
      const { file, filename, contentType, proof, fileId } = response.data;
      const fileBuffer = Buffer.from(file, 'base64');
      const fileHash = this.hashBuffer(fileBuffer);
      return { proof, fileHash, fileBuffer, filename, fileId };
    } catch (error) {
      console.error('Failed to retrieve or process the file:', error);
    }
  }

  /**
   * Verifies the integrity of a file using a Merkle tree proof.
   *
   * @param {string} hash - The hash of the file to be verified.
   * @param {Array<{ isLeft: boolean; sibling: string }>} proof - The Merkle tree proof.
   * @param {string} filename - The name of the file to be verified.
   * @return {Promise<{ isVerified: boolean }>} A promise that resolves to an object indicating whether the file is verified or not.
   */
  async verifyFile(
    hash: string,
    proof: { isLeft: boolean; sibling: string }[],
    id: string,
  ): Promise<{ isVerified: boolean }> {
    try {
      // Read the Merkle root from a file asynchronously

      const merkleRoot = await this.readMerkleRoot(
        id,
        path.join(__dirname, '../..', 'merkleRoot.txt'),
      );

      // Process each pair in the proof to calculate the path to the root
      for (let i = 0; i < proof.length; i++) {
        if (proof[i].isLeft) hash = this.hashPair(hash, proof[i].sibling);
        else hash = this.hashPair(proof[i].sibling, hash);
      }

      // Compare the last remaining hash in the proof with the Merkle root
      if (hash === merkleRoot) {
        return { isVerified: true };
      } else {
        return { isVerified: false };
      }
    } catch (error) {
      // Handle possible errors like file read errors
      console.error('Verification failed:', error);
      return { isVerified: false };
    }
  }

  async processFiles(files: Express.Multer.File[], postUrl: URL): Promise<any> {
    // Add a UUID to each file object
    const filesWithUUID = files.map((file) => ({
      ...file,
      uuid: uuidv4(), // Generate and attach a UUID to each file object
    }));

    console.log("filesWithUUID",filesWithUUID)

    // Sort files by original name, now with UUID attached
    filesWithUUID.sort((a, b) =>
      a.originalname.localeCompare(b.originalname, undefined, {
        sensitivity: 'base',
      }),
    );

    // Assuming computeMerkleRoot can handle files with added UUID
    const merkleRoot = this.computeMerkleRoot(filesWithUUID);

    // Uploading to external server, now sending the modified files array with UUIDs
    const uploadResult = await this.uploadToExternalServer(
      filesWithUUID,
      postUrl,
    );

    for (const file of filesWithUUID) {
      const dataLine = `${file.uuid},${file.originalname}, ${merkleRoot}, ${file.uuid}\n`; // Include UUID in the data line
      const filePath = path.join(__dirname, '../..', 'merkleRoot.txt');
      await fsPromises.appendFile(filePath, dataLine);
    }

    return { merkleRoot, uploadResult };
  }

  async uploadToExternalServer(
    files: ExtendedFile[],
    postUrl: URL,
  ): Promise<string> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file.buffer, file.originalname);
      formData.append('fileUUIDs', file.uuid);
    });

    try {
      const response = await Axios.post(postUrl.href, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });
      return `Upload successful: ${response.statusText}`;
    } catch (error) {
      console.error('Upload failed: ', error);

      if (error.response) {
        // Handling expected errors like HTTP status codes outside the 2xx range
        throw new HttpException(
          `Failed to upload files. Server responded with status: ${error.response.status}`,
          HttpStatus.BAD_GATEWAY,
        );
      } else if (error.request) {
        // The request was made but no response was received
        throw new HttpException(
          'No response received from the server.',
          HttpStatus.GATEWAY_TIMEOUT,
        );
      } else {
        // Something happened in setting up the request and triggered an Error
        throw new HttpException(
          'Error sending request to the server.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  private hashFiles(files: Express.Multer.File[]): string[] {
    return files.map((file) => {
      const hash = crypto
        .createHash('sha256')
        .update(file.buffer)
        .digest('hex');
      return hash;
    });
  }

  hashBuffer(buffer: Buffer) {
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    return hash;
  }

  private hashPair(hash1: string, hash2: string): string {
    const combinedHash = crypto
      .createHash('sha256')
      .update(hash1 + hash2)
      .digest('hex');
    return combinedHash;
  }

  private computeMerkleRoot(files: Express.Multer.File[]): string {
    let hashes = this.hashFiles(files);
    while (hashes.length > 1) {
      const newLevel = [];
      for (let i = 0; i < hashes.length; i += 2) {
        if (i + 1 < hashes.length) {
          newLevel.push(this.hashPair(hashes[i], hashes[i + 1]));
        } else {
          newLevel.push(hashes[i]); // Handling the last odd element
        }
      }
      hashes = newLevel;
    }
    return hashes[0];
  }

  // reading the merkle root corresponding to the file.
  async readMerkleRoot(
    id: string, // Changed parameter to 'id' from 'filename'
    filePath: string,
  ): Promise<string | null> {
    try {
      const data = await fsPromises.readFile(filePath, 'utf8');
      const lines = data.split('\n');
      const targetLine = lines.find((line) => line.startsWith(id + ',')); // Search lines starting with the ID

      if (!targetLine) {
        return null;
      }

      const parts = targetLine.split(',');
      const merkleRoot = parts[2].trim(); // Assuming the Merkle root is the third field based on your example
      return merkleRoot;
    } catch (error) {
      console.error('Error reading the file:', error);
      return null;
    }
  }

  // Old write Data function. Keeps only one root at a time.
  private async writeDataToFile(data: string, relativePath: string) {
    const filePath = path.resolve(__dirname, relativePath);
    fs.writeFile(filePath, data, (error) => {
      if (error) {
        console.error('Failed to write data to file:', error);
        throw new Error('Failed to write data to file');
      } else {
        console.error(`Data written successfully to ${filePath}`);
      }
    });
  }
}
