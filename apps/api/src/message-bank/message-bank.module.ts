import { Module } from '@nestjs/common';
import { MessageSelectionService } from './message-selection.service';

@Module({
  providers: [MessageSelectionService],
  exports: [MessageSelectionService],
})
export class MessageBankModule {}
