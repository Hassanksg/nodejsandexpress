// types/express.d.ts
import { User } from './index';

declare module 'express' {
  interface Request {
    user: User;
  }

}

