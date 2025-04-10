import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Put,
  Body,
  Delete,
} from '@nestjs/common';
import { UserService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiCookieAuth, ApiOperation } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '특정 사용자 조회' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '사용자 목록 조회' })
  findAll() {
    return this.userService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '사용자 정보 수정' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '사용자 삭제' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
