import { Session } from "../../sessions";

declare global {
    namespace Express {
        interface Request {
            session: Session;
        }
    }
}
