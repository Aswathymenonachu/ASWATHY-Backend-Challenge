import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LocationService } from './location.service';

@ApiTags('locations')
@Controller('locations')  
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all locations' })
  async findAll() {
    return this.locationService.findAll();
  }
}