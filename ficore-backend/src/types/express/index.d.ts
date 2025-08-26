// src/types/express/index.d.ts

import { UserDocument } from '../../models/user';

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}
