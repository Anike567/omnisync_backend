import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { CreateSyncDto } from './dto/create-sync.dto';
import { UpdateSyncDto } from './dto/update-sync.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post()
  create(@Body() createSyncDto: CreateSyncDto) {
    return this.syncService.create(createSyncDto);
  }

  @Get()
  findAll() {
    return this.syncService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.syncService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSyncDto: UpdateSyncDto) {
    return this.syncService.update(+id, updateSyncDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.syncService.remove(+id);
  }
}
