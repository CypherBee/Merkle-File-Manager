import { Test, TestingModule } from '@nestjs/testing';
import { FileController } from '../../src/file/file.controller';

describe('FileController', () => {
  let controller: FileController;

  beforeEach(async () => {FileController
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileController],
    }).compile();

    controller = module.get<FileController>(FileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
