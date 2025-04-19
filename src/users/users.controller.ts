import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Put,
  Body,
  Delete,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiCookieAuth, ApiOperation } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserData } from 'src/auth/jwt.strategy';

@ApiTags('users')
@Controller('user')
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '특정 사용자 조회' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '사용자 목록 조회' })
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '사용자 정보 수정' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request & { user: UserData },
  ) {
    // 현재 로그인한 사용자의 ID
    const currentUserId = parseInt(req.user.userId);

    // 자신의 정보를 수정하는 경우 또는 관리자인 경우만 허용
    if (
      currentUserId !== id
      //  && req.user.role !== 'admin'
    ) {
      throw new ForbiddenException(
        '다른 사용자의 정보를 수정할 권한이 없습니다.',
      );
    }
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '사용자 삭제' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
