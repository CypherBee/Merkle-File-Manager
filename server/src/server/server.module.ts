import { Module } from '@nestjs/common';
import { ServerService } from './server.service';
import { ServerController } from './server.controller';
import { FilesService } from 'src/files/files.service';
import { DatabaseModule } from 'src/database/database.module';


@Module({
  imports:[DatabaseModule],
  providers: [ServerService,FilesService],
  controllers: [ServerController]
})
export class ServerModule {}
