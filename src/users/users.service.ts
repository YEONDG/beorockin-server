import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
// import { JwtService } from '@nestjs/jwt';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    // private jwtService: JwtService,
  ) {}

  async register(
    createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const { email, password, username, profileImage } = createUserDto;

    // 이미 존재하는 사용자인지 확인
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('이미 등록된 이메일입니다.');
    }
    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 새 사용자 생성
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      username,
      profileImage,
    });

    await this.userRepository.save(user);

    // 비밀번호를 제외한 사용자 정보 반환
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  async findOne(id: number): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  // findAll 메서드 - 모든 사용자 목록 조회
  async findAll() {
    const users = await this.userRepository.find({
      select: [
        'id',
        'email',
        'username',
        'profileImage',
        'createdAt',
        'updatedAt',
      ],
    });
    return users;
  }

  // update 메서드 - 사용자 정보 수정
  async update(id: number, updateUserDto: UpdateUserDto) {
    // 사용자 존재 여부 확인
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`ID가 ${id}인 사용자를 찾을 수 없습니다`);
    }

    // 비밀번호가 포함되어 있으면 해시 처리
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // 업데이트 실행
    await this.userRepository.update(id, updateUserDto);

    // 업데이트된 사용자 정보 반환 (비밀번호 제외)
    const updatedUser = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'username',
        'profileImage',
        'createdAt',
        'updatedAt',
      ],
    });

    return updatedUser;
  }

  // remove 메서드 - 사용자 삭제
  async remove(id: number) {
    // 사용자 존재 여부 확인
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`ID가 ${id}인 사용자를 찾을 수 없습니다`);
    }

    // 사용자 삭제
    await this.userRepository.delete(id);

    return { id, deleted: true };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'>> {
    // 이메일로 사용자 찾기
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
    }

    // 비밀번호를 제외한 사용자 정보 반환
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  async findOrCreateUserByOAuth(userDetails: {
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
    googleId?: string;
    kakaoId?: string;
    provider: string;
  }) {
    // 먼저 이메일로 사용자 찾기
    const user = await this.findByEmail(userDetails.email);

    if (user) {
      // 사용자가 있으면 OAuth 정보 업데이트
      if (userDetails.googleId) user.googleId = userDetails.googleId;
      if (userDetails.kakaoId) user.kakaoId = userDetails.kakaoId;

      user.profileImage = userDetails.picture || user.profileImage;
      user.firstName = user.firstName || userDetails.firstName;
      user.lastName = user.lastName || userDetails.lastName;
      user.lastLoginAt = new Date();

      return this.userRepository.save(user);
    }

    // 사용자가 없으면 새로 생성
    const newUser = this.userRepository.create({
      email: userDetails.email,
      firstName: userDetails.firstName,
      lastName: userDetails.lastName,
      username:
        `${userDetails.firstName} ${userDetails.lastName}`.trim() ||
        userDetails.email.split('@')[0],
      password: undefined,
      profileImage: userDetails.picture,
      googleId: userDetails.googleId,
      kakaoId: userDetails.kakaoId,
      provider: userDetails.provider,
      isEmailVerified: true,
      lastLoginAt: new Date(),
    });

    return this.userRepository.save(newUser);
  }

  // 이메일로 사용자 찾기
  async findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }
}
