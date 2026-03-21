import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'supersecret123',
    })
  }

  async validate(payload: any) {
    return {
      id: payload.sub ?? payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    }
  }
}
