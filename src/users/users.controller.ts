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
  Patch,
  BadRequestException,
  ConflictException,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiCookieAuth, ApiOperation } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserData } from 'src/auth/jwt.strategy';

@ApiTags('user')
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

  // @UseGuards(JwtAuthGuard)
  // @Get()
  // @ApiCookieAuth('access_token')
  // @ApiOperation({ summary: '사용자 목록 조회' })
  // findAll() {
  //   return this.usersService.findAll();
  // }

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
  @Patch('username')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '유저네임 변경' })
  async updateUsername(
    @Body('username') username: string,
    @Req() req: Request & { user: { userId: number } },
  ) {
    if (!username || username.trim() === '') {
      throw new BadRequestException('사용자 이름을 입력해주세요.');
    }

    try {
      const userId = req.user.userId;
      const updatedUser = await this.usersService.updateUsername(
        userId,
        username,
      );

      return {
        message: '사용자 이름이 성공적으로 변경되었습니다.',
        username: updatedUser.username,
      };
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error) {
        if (error.code === '23505') {
          // PostgreSQL 중복 키 에러 코드
          throw new ConflictException('이미 사용 중인 사용자 이름입니다.');
        }
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '사용자 삭제' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  // 프로필 이미지 URL 저장 엔드포인트
  @Post('profile-image/save')
  @UseGuards(JwtAuthGuard)
  async saveProfileImage(
    @Body() body: { imageKey: string; bucketName: string },
    @Req() req: Request & { user: { userId: number } },
  ) {
    const userId = req.user.userId; // JWT에서 사용자 ID 가져오기

    // S3 이미지 URL 생성
    const imageUrl = `https://${body.bucketName}.s3.amazonaws.com/${body.imageKey}`;

    // 서비스를 통해 사용자 프로필 이미지 URL 업데이트
    await this.usersService.updateProfileImage(userId, imageUrl);

    return { imageUrl };
  }
}
