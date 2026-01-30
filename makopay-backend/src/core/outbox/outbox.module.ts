import { Module } from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { DatabaseModule } from '../database/database.module';
import { MlmModule } from '../../modules/mlm/mlm.module';

@Module({
    imports: [DatabaseModule, MlmModule],
    providers: [OutboxService],
    exports: [OutboxService],
})
export class OutboxModule { }
