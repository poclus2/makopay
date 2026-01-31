import { Module, Global } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { DatabaseModule } from '../../core/database/database.module';

@Global() // Make it global so other services can use SettingsService easily
@Module({
    imports: [DatabaseModule],
    controllers: [SettingsController],
    providers: [SettingsService],
    exports: [SettingsService],
})
export class SettingsModule { }
