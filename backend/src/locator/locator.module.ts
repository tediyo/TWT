import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LocatorService } from './locator.service';
import { LocatorController } from './locator.controller';
import { SearchHistory, SearchHistorySchema } from './search-history.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: SearchHistory.name, schema: SearchHistorySchema }])],
  providers: [LocatorService],
  controllers: [LocatorController],
})
export class LocatorModule { }
