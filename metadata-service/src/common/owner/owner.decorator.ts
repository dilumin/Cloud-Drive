import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';

export const OwnerId = createParamDecorator((_: unknown, ctx: ExecutionContext): bigint => {
  const req = ctx.switchToHttp().getRequest();
  const raw = req.headers['x-owner-id'];

  if (!raw) {
    throw new BadRequestException('Missing required header: x-owner-id');
  }

  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!/^[0-9]+$/.test(v)) {
    throw new BadRequestException('x-owner-id must be a positive integer string');
  }

  return BigInt(v);
});
