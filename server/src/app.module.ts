import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServerModule } from './server/server.module';
import { DatabaseModule } from './database/database.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [ServerModule, DatabaseModule, FilesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
