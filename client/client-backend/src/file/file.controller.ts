import {
  Controller,
  Get,
  Post,
  Param,
  UploadedFiles,
  UseInterceptors,
  Res,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('uploads')
export class FileController {
  private postUrl: URL;
  private getUrl: URL;

  /**
   * FileController constructor
   * @param fileService Instance of FileService
   * @param verificationService Instance of VerificationService
   * @param configService Instance of ConfigService
   */
  constructor(
    private readonly fileService: FileService,
    private readonly configService: ConfigService, // Inject ConfigService
  ) {
    // Use injected ConfigService to get UPLOAD_URL/GET_URL
    const uploadUrl = this.configService.get<string>('UPLOAD_URL', 'http://localhost:3000/upload');
    const getUrl = this.configService.get<string>('GET_URL', 'http://localhost:3000/files');
    // Initialize the URL property
    this.postUrl = new URL(uploadUrl);
    this.getUrl= new URL(getUrl);
  }

  /**
   * Handles file upload requests
   * @param files Files uploaded by the client
   * @returns JSON object containing the Merkle root and the HTTP POST result
   */
  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    try {
      if (!files.length) {
        throw new HttpException('No files uploaded', HttpStatus.BAD_REQUEST);
      }

      // Validate filenames
      files.forEach((file) => {
        if (!/^[\x00-\x7F]*$/.test(file.originalname)) {
          throw new HttpException(
            `Filename contains non-ASCII characters: ${file.originalname}`,
            HttpStatus.BAD_REQUEST,
          );
        }
      });

      const result = await this.fileService.processFiles(files, this.postUrl);
      return result;
    } catch (error) {
      // Better error categorization
      if (error instanceof HttpException) {
        // Re-throw the error if it is already an HttpException
        throw error;
      }

      console.error('Error processing files:', error); // Log the error for debugging

      // Throw a more general HttpException if the error is not already an HttpException
      throw new HttpException(
        'Failed to process files',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Retrieves a file from the server
   * @param id UUID of the file to retrieve
   * @param response Express Response object
   */
  @Get(':id')
  async getFile(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res() response: Response,
  ) {
    try {
      const idUrl = new URL(`${this.getUrl}/${id}`);
      console.log("idUrl",idUrl);
      const fileData = await this.fileService.retrieveFile(idUrl);

      const verificationResult = await this.fileService.verifyFile(
        fileData.fileHash,
        fileData.proof,
        fileData.fileId,
      );

      if (verificationResult.isVerified) {
        // If file is verified, send the file as a binary response and include proof in headers
        response.setHeader('Content-Type', 'application/octet-stream');
        response.setHeader(
          'Content-Disposition',
          `attachment; filename="${fileData.filename}"`,
        );
        response.setHeader(
          'X-File-Proof',
          Buffer.from(fileData.proof.join(',')).toString('base64'),
        );
        response.send(fileData.fileBuffer); // Assuming fileData.file is a Buffer or a stream
      } else {
        throw new BadRequestException({ message: 'File is corrupted.' });
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // Re-throw the error if it's an HttpException
      }
      //console.error('Error retrieving or verifying file:', error);
      throw new HttpException(
        'Error processing your request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
