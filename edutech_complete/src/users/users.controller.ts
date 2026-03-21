// import { Controller, Post, Get, Put, Body, UseGuards, Req } from '@nestjs/common'
// import { UsersService } from './users.service'
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'

// @Controller('api/users')
// @UseGuards(JwtAuthGuard)
// export class UsersController {

//   constructor(private usersService: UsersService) {}

//   // GET /api/users/me — get logged-in user's account info
//   @Get('me')
//   getMe(@Req() req: any) {
//     return this.usersService.findById(req.user.id)
//       .then(user => {
//         if (!user) return { message: 'User not found' }
//         return { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt }
//       })
//   }

//   // PUT /api/users/me — update name or password
//   @Put('me')
//   updateMe(@Req() req: any, @Body() body: { name?: string; password?: string }) {
//     return this.usersService.updateUser(req.user.id, body)
//       .then(user => {
//         if (!user) return { message: 'User not found' }
//         return { id: user.id, name: user.name, email: user.email, role: user.role }
//       })
//   }

//   // POST /api/users/profile — create or update profile
//   @Post('profile')
//   createProfile(@Req() req: any, @Body() body: any) {
//     return this.usersService.createProfile(req.user.id, body)
//   }

//   // GET /api/users/profile — get profile
//   @UseGuards(JwtAuthGuard)
//   @Get('profile')
//   getProfile(@Req() req) {
//     return this.usersService.getProfile(req.user.id)
//   }

// }


import { Controller, Post, Get, Put, Body, UseGuards, Req } from '@nestjs/common'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('api/users')
export class UsersController {

  constructor(private usersService: UsersService) {}

  private serializeUser(user: any) {
    if (!user) {
      return user
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    }
  }

  // ✅ GOOGLE LOGIN (NO JWT)
  @Post('google-login')
  async googleLogin(@Body() body: any) {
    const { email, name } = body;
    let isNewUser = false

    let user = await this.usersService.findByEmail(email);

    if (!user) {
      isNewUser = true
      user = await this.usersService.create({
        email,
        name,
        password: "GOOGLE_AUTH",
        role: "student",
      });
    }

    const token = this.usersService.generateJwt(user!);

    return {
      token,
      user: this.serializeUser(user),
      isNewUser,
    };
  }

  // ✅ PROTECTED ROUTES

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: any) {
    const user = await this.usersService.findById(req.user.id)
    return this.serializeUser(user)
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateMe(@Req() req: any, @Body() body: any) {
    const user = await this.usersService.updateUser(req.user.id, body)
    return this.serializeUser(user)
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  createProfile(@Req() req: any, @Body() body: any) {
    return this.usersService.createProfile(req.user.id, body)
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: any) {
    return this.usersService.getProfile(req.user.id)
  }
}

