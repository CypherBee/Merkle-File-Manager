import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as path from 'path';
import { DatabaseService } from 'src/database/database.service';
import { promises as fs } from 'fs';

@Injectable()
export class FilesService {
  private uploadsDirectory: string = path.join(__dirname, '../../uploads'); // Adjust based on your directory structure

  constructor(private readonly databaseService: DatabaseService) {}

  async createMultiple(createFileDtos: Prisma.FileCreateInput[]) {
    return this.databaseService.file.createMany({
      data: createFileDtos,
      skipDuplicates: true,
    });
  }

  async create(createFileDto: Prisma.FileCreateInput) {
    return this.databaseService.file.create({
      data: createFileDto,
    });
  }

  async findAll() {
    return this.databaseService.file.findMany();
  }

  async findOne(id: string) {
    return this.databaseService.file.findUnique({
      where: {
        id,
      },
    });
  }

  async update(id: number, updateFileDto: Prisma.FileUpdateInput) {
    return `This action updates a #${id} file -- not needed`;
  }

  async remove(id: string) {
    return this.databaseService.file.delete({
      where: {
        id,
      },
    });
  }

  async purge() {
    await this.clearDirectory(this.uploadsDirectory);
    const deleteResult = await this.databaseService.file.deleteMany({});

    return deleteResult;
  }

  async clearDirectory(directory: string) {
    const files = await fs.readdir(directory, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(directory, file.name);
      if (file.isDirectory()) {
        await this.clearDirectory(fullPath);
        // If you decide to remove the directory uncomment the next line
        // await fs.rmdir(fullPath);
      } else {
        await fs.unlink(fullPath);
      }
    }
  }

  async filesInSameUpload(id: string) {
    const row = await this.databaseService.file.findUnique({
      where: { id },
      select: { uploadId: true },
    });

    if (!row) {
      throw new Error(`No record found with ID ${id}`);
    }

    return this.databaseService.file.findMany({
      where: { uploadId: row.uploadId },
    });
  }
}
