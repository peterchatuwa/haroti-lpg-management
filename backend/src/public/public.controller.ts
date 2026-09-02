import { Body, Controller, Get, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CareersFormDto } from './dto/careers-form.dto';
import { ContactFormDto } from './dto/contact-form.dto';
import { FranchiseFormDto } from './dto/franchise-form.dto';
import { SubmitOrderDto } from './dto/submit-order.dto';
import { PublicCatalogService } from './public-catalog.service';
import { PublicFormsService } from './public-forms.service';
import { PublicOrdersService } from './public-orders.service';

@Controller('public')
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class PublicController {
  constructor(
    private readonly catalogService: PublicCatalogService,
    private readonly formsService: PublicFormsService,
    private readonly ordersService: PublicOrdersService,
  ) {}

  @Get('catalog')
  getCatalog() {
    return this.catalogService.getCatalog();
  }

  @Get('stations')
  listStations() {
    return this.ordersService.listStations();
  }

  @Post('orders')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  submitOrder(@Body() dto: SubmitOrderDto) {
    return this.ordersService.submitOrder(dto);
  }

  @Post('contact')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  submitContact(@Body() dto: ContactFormDto) {
    return this.formsService.submitContact(dto);
  }

  @Post('franchise')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  submitFranchise(@Body() dto: FranchiseFormDto) {
    return this.formsService.submitFranchise(dto);
  }

  @Post('careers')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  submitCareers(@Body() dto: CareersFormDto) {
    return this.formsService.submitCareers(dto);
  }
}
