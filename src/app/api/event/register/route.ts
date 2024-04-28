import firebaseAdminApp from "@/firebase/admin";
import { getFirestore } from "firebase-admin/firestore";
import jwt from "jsonwebtoken";

interface UserData {
    name: string;
    questions: {
        [key: string]: string;
    };
}


export async function POST(request: Request) {
    const { eventId, userData }: { eventId: string; userData: UserData } = await request.json();

    const db = getFirestore(firebaseAdminApp);

    // ユーザー情報を保存
    const user = await db.collection('events').doc(eventId).collection('attendees').add({
        name: userData.name,
        info: userData.questions,
        role: "audience"
    });

    const userId = user.id;

    const dateStr = new Date().toISOString();
    const token = jwt.sign({
        userId,
        eventId,
        dateStr
    }, process.env.JWT_SECRET as string);


    return new Response(JSON.stringify({ userId, token }), {});
}