import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // TODO: Candidates need to implement rate limiting based on locationId here
  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  async findAll() {
    return this.orderService.findAll();
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get orders by customer' })
  async findByCustomer(@Param('customerId') customerId: string) {
    return this.orderService.getOrdersByCustomer(customerId);
  }

  @Get('report/:locationId')
  @ApiOperation({ summary: 'Generate order report for location' })
  async generateReport(@Param('locationId') locationId: string) {
    return this.orderService.generateOrderReport(locationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  async findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order' })
  async update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.updateOrder(id, updateOrderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete order' })
  async remove(@Param('id') id: string) {
    return this.orderService.deleteOrder(id);
  }
}