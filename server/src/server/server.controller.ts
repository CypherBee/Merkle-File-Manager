import {
  Get,
  Res,
  Param,
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  HttpException,
  HttpStatus,
  NotFoundException,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Response } from 'express';
import { extname, parse } from 'path';
import { ServerService } from './server.service';
import { FilesService } from 'src/files/files.service';
import * as mime from 'mime';
import * as fs from 'fs';
import { promisify } from 'util';

const readFileAsync = promisify(fs.readFile);
interface ExtendedFile extends Express.Multer.File {
  uuid: string;  // Make UUID a non-optional property if it will always be present
}
@Controller()
export class ServerController {
  constructor(
    private serverService: ServerService,
    private filesService: FilesService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 600, {
      storage: diskStorage({
        destination: './uploads', // Creates the Path if Inexistent: Remove additional checks
        filename: (req, file, cb) => {
          const originalName = parse(file.originalname).name;
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const extension = extname(file.originalname);
          cb(null, `${originalName}-${uniqueSuffix}${extension}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit per file
    }),
  )
  async uploadFiles(
    @UploadedFiles() files: ExtendedFile[],@Req() req: any
  ): Promise<any> {
    if (!files || files.length === 0) {
      throw new HttpException('No files uploaded', HttpStatus.BAD_REQUEST);
    }

    // adding uuids to the file as the uuids were sent in the request body.
    const uuids:string[]=req.body.fileUUIDs
    files.forEach((file, index) => {file.uuid=uuids[index]
    })

    try {
      const responses = await this.serverService.handleFileUploads(files);
      return responses;
    } catch (error) {
      const errorMessage = `Failed to upload files due to an error: ${error.message}`;
      console.error(errorMessage, error.stack); // Ensure detailed logs are available
      throw new HttpException(
        'Failed to process upload request.', // More generic message for the client
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Get('files')
  async listFiles(@Res() res: Response) {
    try {
      const files = await this.filesService.findAll();
      res.status(HttpStatus.OK).json(files);
    } catch (error) {
      throw new HttpException(
        'Failed to list files',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('files/:id')
  async getFile(
    @Param('id', new ParseUUIDPipe()) fileId: string,
  ): Promise<any> {
    const file = await this.filesService.findOne(fileId);
    if (!file) {
      throw new NotFoundException('File not found');
    }
    const fileData = await this.serverService.getFile(file.servername);
    const filePath = fileData.path;
    const contentType = mime.lookup(filePath) || 'application/octet-stream';

    // Read the file data asynchronously
    const fileContents = await readFileAsync(filePath);
    const proof = await this.serverService.getProof(fileId);

    // Encode the file and proof to Base64
    const base64File = fileContents.toString('base64');
    const responseData = {
      file: base64File,
      filename: file.filename,
      contentType: contentType,
      proof: proof,
      fileId:file.id
    };

    return responseData; // Return directly, letting Nest handle the response formatting.
  }
}
