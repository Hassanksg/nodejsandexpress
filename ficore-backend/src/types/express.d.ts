// types/express.d.ts
import { User } from './index';

declare module 'express' {
  interface Request {
    user: User;
  }

}

// src/types/express/index.d.ts

import { UserDocument } from '../../models/user';

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}
