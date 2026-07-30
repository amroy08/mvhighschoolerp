import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { EncryptionService } from '../../common/services/encryption.service';

@Module({
  controllers: [StudentsController],
  providers: [StudentsService, EncryptionService],
  exports: [StudentsService],
})
export class StudentsModule {}
