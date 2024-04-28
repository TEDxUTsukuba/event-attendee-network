import jwt from "jsonwebtoken";
import firebaseAdminApp from "@/firebase/admin";
import { getFirestore } from "firebase-admin/firestore";

export async function GET(request: Request) {
    // headers から token を取得
    const token = request.headers.get("Authorization");

    if (!token) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        // token の検証
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
            userId: string;
            eventId: string;
            dateStr: string;
        };

        const db = getFirestore(firebaseAdminApp);

        // ユーザー情報を取得
        const user = await db.collection('events').doc(decoded.eventId).collection('attendees').doc(decoded.userId).get();

        return new Response(JSON.stringify({
            userId: decoded.userId,
            eventId: decoded.eventId,
            name: user.data()?.name,
        }), {});
    } catch (e) {
        return new Response("Unauthorized", { status: 401 });
    }
}