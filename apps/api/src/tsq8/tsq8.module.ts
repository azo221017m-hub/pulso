import { Module } from '@nestjs/common';
import { Tsq8Service } from './tsq8.service';
import { Tsq8Controller } from './tsq8.controller';

@Module({
  providers: [Tsq8Service],
  controllers: [Tsq8Controller],
})
export class Tsq8Module {}
